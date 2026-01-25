import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, verifyElevenLabsSignature } from "../shared-utils.ts";

const ELEVENLABS_WEBHOOK_SECRET = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET') || 'wsec_b9ad901e60591d1d74c28ee0bdca643344a6dd48d2c81c2115183f7a565af65b';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient();
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const signature = req.headers.get('elevenlabs-signature');

    console.log('ElevenLabs Webhook received:', body);

    // 1. Validate Signature
    if (signature && !(await verifyElevenLabsSignature(rawBody, signature, ELEVENLABS_WEBHOOK_SECRET))) {
      console.error('Invalid ElevenLabs Signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const eventType = body.type || 'unknown';
    const callId = body.call_id || body.conversation_id;

    // 2. Log the integration event
    await supabase.from('integration_logs').insert({
      provider: 'elevenlabs',
      external_id: callId,
      status: eventType,
      payload_ref: body,
      message_safe: `ElevenLabs Event: ${eventType}`
    });

    // 3. Find Lead by call_id (last_call_id or lookup in call_events)
    let leadId: string | null = null;
    if (callId) {
        const { data: callEvent } = await supabase
            .from('call_events')
            .select('lead_id')
            .eq('call_sid', callId)
            .single();
        
        if (callEvent) {
            leadId = callEvent.lead_id;
        } else {
            // Fallback: search in leads last_call_id
            const { data: leads } = await supabase
                .from('leads')
                .select('id')
                .eq('last_call_id', callId)
                .limit(1);
            if (leads && leads.length > 0) leadId = leads[0].id;
        }
    }

    if (leadId) {
        if (eventType === 'post_call_transcription') {
            const analysis = body.analysis || {};
            const transcript = body.transcript || '';
            const outcome = analysis.call_outcome || {};
            
            // Extract structured outcome
            const resData = {
                lead_id: leadId,
                call_sid: callId,
                conversation_id: body.conversation_id,
                transcript: transcript,
                summary: analysis.summary,
                outcome: analysis,
                scheduled_datetime: analysis.scheduled_at || analysis.appointment_time,
                scheduled_channel: analysis.channel || analysis.scheduled_channel,
                do_not_call: analysis.do_not_call === true,
            };

            await supabase.from('conversation_results').upsert(resData, { onConflict: 'conversation_id' });

            // Update Lead Meta
            const leadUpdate: any = {};
            if (resData.do_not_call) leadUpdate.do_not_call = true;
            
            if (Object.keys(leadUpdate).length > 0) {
                await supabase.from('leads').update(leadUpdate).eq('id', leadId);
            }

            // Log event
            await supabase.from('lead_events').insert({
                lead_id: leadId,
                event_type: 'conversation.completed',
                payload: body
            });

        } else if (eventType === 'call_initiation_failed') {
            await supabase.from('lead_events').insert({
                lead_id: leadId,
                event_type: 'conversation.failed_initiation',
                payload: body
            });
        }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
