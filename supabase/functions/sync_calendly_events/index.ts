import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, safeLog } from '../shared-utils.ts'

// Configuration
const CALENDLY_API_BASE = 'https://api.calendly.com'

interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  invitees?: unknown[];
  [key: string]: unknown;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  let eventsProcessed = 0;
  let matchesFound = 0;
  let updatesMade = 0;
  let errors: string[] = [];

  try {
    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Try env var first, then app_settings
    let calendlyToken = Deno.env.get('CALENDLY_API_TOKEN')
    
    if (!calendlyToken) {
        console.log('CALENDLY_API_TOKEN not in env, checking app_settings...')
        const { data: setting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'CALENDLY_API_TOKEN')
            .single()
        
        if (setting?.value) {
            calendlyToken = setting.value
        }
    }

    if (!calendlyToken) {
        throw new Error('Missing Calendly Token (neither env var nor app_settings)')
    }

    // 2. Fetch Active Events from Calendly
    console.log('Fetching Calendly user URI...')
    const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, {
        headers: {
            'Authorization': `Bearer ${calendlyToken}`,
            'Content-Type': 'application/json'
        }
    })

    if (!userResponse.ok) {
        throw new Error(`Calendly User API Error: ${userResponse.status}`)
    }

    const userData = await userResponse.json()
    const userUri = userData.resource.uri
    console.log(`Current user URI: ${userUri}`)

    // Increased count to 100 to avoid missing events.
    console.log('Fetching Calendly events...')
    const eventsResponse = await fetch(`${CALENDLY_API_BASE}/scheduled_events?user=${userUri}&status=active&count=100`, {
        headers: {
            'Authorization': `Bearer ${calendlyToken}`,
            'Content-Type': 'application/json'
        }
    })

    if (!eventsResponse.ok) {
        const errText = await eventsResponse.text()
        throw new Error(`Calendly API Error: ${eventsResponse.status} - ${errText}`)
    }

    const eventsData = await eventsResponse.json()
    const events = eventsData.collection || []
    eventsProcessed = events.length;
    console.log(`Found ${events.length} active events.`)

    // 3. Process each event
    for (const event of events) {
        const inviteesUrl = `${event.uri}/invitees`
        const inviteesResponse = await fetch(inviteesUrl, {
            headers: {
                'Authorization': `Bearer ${calendlyToken}`,
                'Content-Type': 'application/json'
            }
        })

        if (!inviteesResponse.ok) {
            const err = `Failed to fetch invitees for event ${event.uri}: ${inviteesResponse.status}`;
            console.error(err)
            errors.push(err);
            continue
        }

        const inviteesData = await inviteesResponse.json()
        const invitees = inviteesData.collection || []

        for (const invitee of invitees) {
            const email = invitee.email?.toLowerCase()
            if (!email) continue

            // --- 4. Match AGENTS ---
            const { data: agents } = await supabase
                .from('agentes')
                .select('id, calendly_events')
                .eq('email', email)
            
            if (agents && agents.length > 0) {
                const agent = agents[0]
                const currentEvents = Array.isArray(agent.calendly_events) ? agent.calendly_events : []
                const eventExists = currentEvents.some((e: CalendlyEvent) => e.uri === event.uri)

                if (!eventExists) {
                    const eventToStore = { ...event, invitee_details: invitee }
                    const newEvents = [...currentEvents, eventToStore]

                    const { error: updateError } = await supabase
                        .from('agentes')
                        .update({ 
                            calendly_events: newEvents,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', agent.id)
                    
                    if (updateError) {
                        const err = `Failed to update agent ${agent.id}: ${updateError.message}`;
                        console.error(err)
                        errors.push(err);
                    } else {
                        console.log(`Updated agent ${agent.id} with new event ${event.uri}`)
                        updatesMade++
                    }
                }
                matchesFound++
            }

            // --- 5. Match LEADS ---
            const { data: leads } = await supabase
                .from('leads')
                .select('id, full_name')
                .eq('email', email)

            if (leads && leads.length > 0) {
                for (const lead of leads) {
                    const { data: existingEvents } = await supabase
                        .from('lead_events')
                        .select('id')
                        .eq('lead_id', lead.id)
                        .eq('event_type', 'appointment.scheduled')
                        .eq('payload->>uri', event.uri) 
                    
                    if (!existingEvents || existingEvents.length === 0) {
                        const payload = {
                            ...event,
                            invitee_details: invitee,
                            provider: 'calendly'
                        }

                        const { error: insertError } = await supabase
                            .from('lead_events')
                            .insert({
                                lead_id: lead.id,
                                event_type: 'appointment.scheduled',
                                payload: payload
                            })

                        if (insertError) {
                            const err = `Failed to insert lead_event for lead ${lead.id}: ${insertError.message}`;
                            console.error(err)
                            errors.push(err);
                        } else {
                            console.log(`Inserted appointment for lead ${lead.id} (${lead.full_name})`)
                            updatesMade++
                        }
                    }
                }
                matchesFound++
            }
        }
    }

    const duration = Date.now() - startTime;
    const summary = `Sync complete. Found ${eventsProcessed} events, matched ${matchesFound} records, updated ${updatesMade}. Total time: ${duration}ms.`;
    
    // Log to integration_logs for visibility in CRM
    await supabase.from('integration_logs').insert({
        provider: 'calendly',
        status: errors.length > 0 ? 'partial_success' : 'success',
        message_safe: summary,
        payload_ref: { 
            events_fetched: eventsProcessed,
            matches: matchesFound,
            updates: updatesMade,
            duration_ms: duration,
            errors: errors.slice(0, 10) // Limit error collection
        }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: summary
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    )
  } catch (error) {
    console.error('Error in syncCalendlyEvents:', error)
    
    // Attempt to log failure
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey)
            await supabase.from('integration_logs').insert({
                provider: 'calendly',
                status: 'failure',
                message_safe: `Sync failed: ${getErrorMessage(error).substring(0, 500)}`,
                payload_ref: { error: getErrorMessage(error) }
            });
        }
    } catch (logErr) {
        console.error('Failed to log sync error to DB:', logErr)
    }

    return new Response(
      JSON.stringify({ success: false, error: getErrorMessage(error) }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      },
    )
  }
})
