
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CALENDLY_API_BASE = 'https://api.calendly.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testEventTypes() {
    console.log('Fetching Calendly token...')
    let calendlyToken = Deno.env.get('CALENDLY_API_TOKEN')
    
    if (!calendlyToken) {
        const { data: setting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'CALENDLY_API_TOKEN')
            .single()
        if (setting?.value) calendlyToken = setting.value
    }

    if (!calendlyToken) {
        console.error('No token found')
        return
    }

    console.log('Fetching User URI...')
    const userRes = await fetch(`${CALENDLY_API_BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${calendlyToken}` }
    })
    
    if (!userRes.ok) {
        console.error('Failed to get user:', await userRes.text())
        return
    }
    
    const userData = await userRes.json()
    const userUri = userData.resource.uri
    console.log('User URI:', userUri)

    console.log('Fetching Event Types...')
    const eventsRes = await fetch(`${CALENDLY_API_BASE}/event_types?user=${userUri}`, {
        headers: { 'Authorization': `Bearer ${calendlyToken}` }
    })

    if (!eventsRes.ok) {
        console.error('Failed to get event types:', await eventsRes.text())
        return
    }

    const eventsData = await eventsRes.json()
    console.log('Event Types found:', eventsData.collection.length)
    interface EventType { name: string; scheduling_url: string; }
    eventsData.collection.forEach((et: EventType) => {
        console.log(`- ${et.name} (${et.scheduling_url})`)
    })
}

testEventTypes()
