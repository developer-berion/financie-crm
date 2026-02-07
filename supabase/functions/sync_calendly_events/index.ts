import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../shared-utils.ts'

// Configuration
const CALENDLY_API_BASE = 'https://api.calendly.com'

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
    // TODO: Handle pagination if volume > 20. For now, fetch 100 max.
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

            // 4. Find matching Agent in Supabase
            const { data: agents, error: searchError } = await supabase
                .from('agentes')
                .select('id, calendly_events')
                .eq('email', email)
            
            if (searchError) {
                console.error(`Error searching agent by email ${email}:`, searchError)
                continue
            }

            if (agents && agents.length > 0) {
                matchCount++
                const agent = agents[0]
                
                // 5. Update Agent record
                // Check if event already exists in the array to avoid duplicates
                const currentEvents = Array.isArray(agent.calendly_events) ? agent.calendly_events : []
                const eventExists = currentEvents.some((e: any) => e.uri === event.uri)

                if (!eventExists) {
                    // Enrich event object with invitee data if needed, or just store the event + invitee info
                    const eventToStore = {
                        ...event,
                        invitee_details: invitee // Store invitee specific answers/name
                    }

                    const newEvents = [...currentEvents, eventToStore]

                    const { error: updateError } = await supabase
                        .from('agentes')
                        .update({ 
                            calendly_events: newEvents,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', agent.id)
                    
                    if (updateError) {
                        console.error(`Failed to update agent ${agent.id}:`, updateError)
                    } else {
                        console.log(`Updated agent ${agent.id} with new event ${event.uri}`)
                        updatedCount++
                    }
                }
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
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      },
    )
  }
})
