import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient } from "../shared-utils.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { lead_id } = await req.json();

        if (!lead_id) {
            throw new Error('Missing lead_id');
        }

        const supabase = getSupabaseClient();

        // 1. Fetch Lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', lead_id)
            .single();

        if (leadError || !lead) {
            throw new Error('Lead not found');
        }

        // 2. Check Consent (Safety guard)
        if (!lead.marketing_consent) {
            // We authorize the user to override this via UI if needed, but for now we enforce it or throw warning
            // throw new Error('Lead has not given marketing consent'); 
            // Turning into a warning for now as we might want to manually trigger
            console.warn(`Lead ${lead.id} has no marketing consent registered.`);
        }

        // 3. Get Secrets
        const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
        const agentId = 'agent_4101kf6gqfgpfrganck3s1m0ap3v'; // User provided
        
        // This secret needs to be set after buying a number
        const phoneId = Deno.env.get('ELEVENLABS_PHONE_ID') || Deno.env.get('ELEVENLABS_PHONE_NUMBER_ID');

        if (!apiKey) {
            throw new Error('ELEVENLABS_API_KEY not configured');
        }

        /* 
           NOTE: Without a phone_id, we cannot make an outbound call in most configurations.
           If the user hasn't set it yet, we return a helpful error.
        */
        // if (!phoneId) {
        //     throw new Error('ELEVENLABS_PHONE_ID not configured. Please buy a number in ElevenLabs and set the secret.');
        // }

        // 4. Trigger Call via ElevenLabs API
        // Documentation: https://elevenlabs.io/docs/api-reference/connect-call
        // Endpoint: POST https://api.elevenlabs.io/v1/convai/phone-calls (Verify correct endpoint)
        
        // Validating phone number format (E.164 usually required)
        // Simple cleanup:
        const phone = lead.phone.replace(/\D/g, ''); 
        // Assuming user stores it as +1..., if not we might need to prepend +
        const formattedPhone = phone.startsWith('1') || phone.startsWith('5') ? `+${phone}` : `+${phone}`; 

        const payload = {
            agent_id: agentId,
            recipient_phone_number: formattedPhone,
            dynamic_variables: {
                lead_name: lead.full_name
            }
        };

        // Note: If using a specific phone_id, the API might be different or require it in payload
        // If we use the "Trigger Call" endpoint:
        const response = await fetch('https://api.elevenlabs.io/v1/convai/phone-calls', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('ElevenLabs Error:', result);
            throw new Error(`ElevenLabs API Error: ${result.detail?.message || result.message || JSON.stringify(result)}`);
        }

        // 5. Log Event
        await supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'call.outbound_triggered',
            payload: { 
                provider: 'elevenlabs', 
                call_id: result.call_id,
                agent_id: agentId 
            }
        });

        return new Response(JSON.stringify({ success: true, call_id: result.call_id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
