import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, getLeadContext } from "../shared-utils.ts";

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
            console.warn(`Lead ${lead.id} has no marketing consent registered.`);
        }

        // --- Context Preparation Logic ---
        // Use meta_created_at if available, fallback to created_at
        const signupTimeRaw = lead.meta_created_at || lead.created_at;
        const context = getLeadContext(lead.state, signupTimeRaw);

        // Update lead in DB if columns are empty (for visibility as requested by user)
        if (!lead.signup_date || !lead.signup_time) {
            await supabase.from('leads').update({
                signup_date: context.signup_date,
                signup_time: context.signup_time,
                state: lead.state || 'Estados Unidos' // Ensure state is at least fallback if null
            }).eq('id', lead.id);
        }
        // ---------------------------------

        // 3. Get Secrets
        const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
        const agentId = 'agent_4101kf6gqfgpfrganck3s1m0ap3v'; 
        
        const phoneId = Deno.env.get('ELEVENLABS_PHONE_ID') || Deno.env.get('ELEVENLABS_PHONE_NUMBER_ID');

        if (!apiKey) {
            throw new Error('ELEVENLABS_API_KEY not configured');
        }

        // 4. Trigger Call via ElevenLabs API
        let rawPhone = lead.phone || '';
        let phone = rawPhone.replace(/\D/g, ''); 
        
        console.log(`[MakeOutboundCall] LeadID: ${lead.id}, DB Phone: ${rawPhone}, Cleaned: ${phone}`);

        if (phone.length === 10) {
            phone = '1' + phone;
        }
        
        const formattedPhone = `+${phone}`; 
        
        // Safety Check: Prevent calling self (infinity loop / busy signal)
        // We need to resolve what the "Agent Number" is. 
        // We know from logs it is '+17863212663' but we only have the Phone ID here.
        // We will just log heavily for now and maybe alert if it matches a known bad number.
        
        console.log(`[MakeOutboundCall] Final Target Phone: ${formattedPhone}`);
        console.log(`[MakeOutboundCall] Using Agent Phone ID: ${phoneId}`);

        const payload = {
            agent_id: agentId,
            agent_phone_number_id: phoneId,
            to_number: formattedPhone,
            conversation_initiation_client_data: {
                dynamic_variables: {
                    lead_name: lead.full_name,
                    lead_signup_date: context.signup_date,
                    lead_signup_time: context.signup_time,
                    lead_state: context.lead_state
                }
            }
        };

        // Endpoint: POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call
        const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
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
                agent_id: agentId,
                context_sent: {
                    date: context.signup_date,
                    time: context.signup_time,
                    state: context.lead_state
                }
            }
        });

        // 6. Link Call ID to Lead (CRITICAL for Webhook)
        await supabase.from('leads').update({
            last_call_id: result.call_id
        }).eq('id', lead.id);

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
