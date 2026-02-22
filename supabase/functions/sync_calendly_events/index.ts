import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared-utils.ts'

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
    // First, get current user URI
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

    // We'll fetch "active" events. Pagination matches 20 by default.
    // We'll fetch "active" events. Pagination matches 20 by default.
    // [CRM-002] CRITICAL: Reduced to 10 to avoid N+1 DB lockup until structural fix.
    console.log('Fetching Calendly events...')
    const eventsResponse = await fetch(`${CALENDLY_API_BASE}/scheduled_events?user=${userUri}&status=active&count=10`, {
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
    console.log(`Found ${events.length} active events.`)

    let updatedCount = 0
    let matchCount = 0

    // 3. Process each event
    for (const event of events) {
        // Fetch Invitees for this event to get the email
        // event.uri looks like: https://api.calendly.com/scheduled_events/UUID
        const inviteesUrl = `${event.uri}/invitees`
        const inviteesResponse = await fetch(inviteesUrl, {
            headers: {
                'Authorization': `Bearer ${calendlyToken}`,
                'Content-Type': 'application/json'
            }
        })

        if (!inviteesResponse.ok) {
            console.error(`Failed to fetch invitees for event ${event.uri}`)
            continue
        }

        const inviteesData = await inviteesResponse.json()
        const invitees = inviteesData.collection || []

        // Usually 1 invitee for 1-on-1 calls
        for (const invitee of invitees) {
            const email = invitee.email

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
                    
                    if (updateError) console.error(`Failed to update agent ${agent.id}:`, updateError)
                    else {
                        console.log(`Updated agent ${agent.id} with new event ${event.uri}`)
                        updatedCount++
                    }
                }
                matchCount++
            }

            // --- 5. Match LEADS ---
            // Only process if status is active (or maybe we want canceled too? let's stick to all and filter in UI)
            // Actually API query was filtered by status=active. So these are active events.
            
            const { data: leads } = await supabase
                .from('leads')
                .select('id')
                .eq('email', email)

            if (leads && leads.length > 0) {
                for (const lead of leads) {
                    // Check if event already exists in lead_events
                    // We assume payload->>'uri' holds the ID
                    const { data: existingEvents } = await supabase
                        .from('lead_events')
                        .select('id')
                        .eq('lead_id', lead.id)
                        .eq('event_type', 'appointment.scheduled')
                        .filter('payload->uri', 'eq', event.uri) 
                    
                    // Note: Supabase JSON filtering syntax might vary. using .contains is safer for some JSONB
                    // But let's fetch checking overlap. Since we don't have a unique constraint on (lead_id, uri) in DB (yet),
                    // we must check manually.
                    
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
                            console.error(`Failed to insert lead_event for lead ${lead.id}:`, insertError)
                        } else {
                            console.log(`Inserted appointment for lead ${lead.id}`)
                            updatedCount++
                        }
                    }
                }
                matchCount++
            }
        }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sync complete. Found ${events.length} events, matched ${matchCount} agents, updated ${updatedCount} records.` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      },
    )
  } catch (error) {
    console.error('Error in syncCalendlyEvents:', error)
    return new Response(
      JSON.stringify({ success: false, error: getErrorMessage(error) }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      },
    )
  }
})
