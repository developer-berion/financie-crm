import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { COMMUNICATIONS_ENABLED, corsHeaders, getCorrelationId, getSupabaseClient, getLeadContext, logStructured, maskPhone, safeLog } from "../shared-utils.ts";

serve(async (req) => {
    const correlationId = getCorrelationId(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (!COMMUNICATIONS_ENABLED) {
        logStructured('warn', 'make_outbound_call', 'communications_disabled', {
            correlation_id: correlationId,
        });
        return new Response(JSON.stringify({ success: true, call_id: 'DISABLED_BY_CONFIG' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
            logStructured('warn', 'make_outbound_call', 'missing_marketing_consent', {
                correlation_id: correlationId,
                lead_id: lead.id,
            });
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

        // 3. Get Secrets (CRM-008: agentId from env var)
        const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
        const agentId = Deno.env.get('ELEVENLABS_AGENT_ID');
        
        const phoneId = Deno.env.get('ELEVENLABS_PHONE_ID') || Deno.env.get('ELEVENLABS_PHONE_NUMBER_ID');

        if (!apiKey) {
            throw new Error('ELEVENLABS_API_KEY not configured');
        }
        if (!agentId) {
            throw new Error('ELEVENLABS_AGENT_ID not configured');
        }

        // 4. Trigger Call via ElevenLabs API
        const rawPhone = lead.phone || '';
        let phone = rawPhone.replace(/\D/g, ''); 
        
        safeLog(`[MakeOutboundCall] LeadID: ${lead.id}, Phone: ${maskPhone(rawPhone)}`);
        logStructured('info', 'make_outbound_call', 'lead_loaded', {
            correlation_id: correlationId,
            lead_id: lead.id,
        });

        if (phone.length === 10) {
            phone = '1' + phone;
        }
        
        const formattedPhone = `+${phone}`; 
        
        // Safety Check: Prevent calling self (infinity loop / busy signal)
        // We need to resolve what the "Agent Number" is. 
        // We know from logs it is '+17863212663' but we only have the Phone ID here.
        // We will just log heavily for now and maybe alert if it matches a known bad number.
        
        safeLog(`[MakeOutboundCall] Final Target: ${maskPhone(formattedPhone)}, AgentPhoneID: ${phoneId ? '[SET]' : '[MISSING]'}`);

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
            logStructured('error', 'make_outbound_call', 'provider_error', {
                correlation_id: correlationId,
                provider: 'elevenlabs',
                lead_id: lead.id,
                provider_payload: result,
            });
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
                correlation_id: correlationId,
                context_sent: {
                    date: context.signup_date,
                    time: context.signup_time,
                    state: context.lead_state
                }
            }
        });

        await supabase.from('integration_logs').insert({
            provider: 'elevenlabs_outbound',
            request_id: correlationId,
            status: 'success',
            message_safe: 'Outbound call accepted by provider',
            payload_ref: {
                lead_id: lead.id,
                call_id: result.call_id,
            },
        });

        // 6. Link Call ID to Lead (CRITICAL for Webhook)
        await supabase.from('leads').update({
            last_call_id: result.call_id
        }).eq('id', lead.id);

        return new Response(JSON.stringify({ success: true, call_id: result.call_id, correlation_id: correlationId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStructured('error', 'make_outbound_call', 'request_failed', {
            correlation_id: correlationId,
            error: errorMessage,
        });
        return new Response(JSON.stringify({ error: errorMessage, correlation_id: correlationId }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
