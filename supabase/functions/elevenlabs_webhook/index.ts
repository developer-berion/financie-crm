import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, verifyElevenLabsSignature } from "../shared-utils.ts";

const ELEVENLABS_WEBHOOK_SECRET = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET') || 'wsec_fa658b2ea7fabead2bbb959c962d4121125a06d1638d390864864b751efc1ff5';

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
                // Fetch current lead data to check for empty fields
                const { data: currentLead } = await supabase
                    .from('leads')
                    .select('main_objective, stable_income, health_condition')
                    .eq('id', leadId)
                    .single();

                if (eventType === 'post_call_transcription') {
                    const analysis = body.analysis || {};
                    let transcript = body.transcript || body.transcription || '';

                    // 3.1. Transcript Fallback: If missing, fetch from API
                    if (!transcript && Deno.env.get('ELEVENLABS_API_KEY')) {
                         try {
                            console.log(`Fetching transcript from API for conversation ${body.conversation_id}`);
                            const convResp = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${body.conversation_id}`, {
                                headers: {
                                    'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') as string
                                }
                            });
                            if (convResp.ok) {
                                const convData = await convResp.json();
                                // ElevenLabs API returns 'transcript' as an array of objects usually, 
                                // but for simplicity or if it matches their other formats, we conform it.
                                // The API usually returns: { transcript: [ { role: 'agent', message: '...' } ] }
                                // We might want to flatten it to a string or store the JSON.
                                // For now, let's assume we want a string representation if possible, or just the raw object.
                                // Let's check the schema. The user wants "transcription".
                                // If the original 'transcript' in body was string, we try to match.
                                // Actually, let's just store the full detail if we can, or map it.
                                if (convData.transcript) {
                                     transcript = convData.transcript.map((t: any) => `${t.role}: ${t.message}`).join('\n');
                                }
                            } else {
                                console.error('Failed to fetch transcript from API', await convResp.text());
                            }
                         } catch (err) {
                             console.error('Error fetching transcript API:', err);
                         }
                    }

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

                    // AI Field Population Logic (Only if currently empty in DB)
                    // Normalization helpers
                    const normalizeYesNo = (val: string) => {
                        if (!val) return null;
                        const lower = String(val).toLowerCase().trim();
                        if (['si', 'sí', 'yes', 'true'].includes(lower)) return 'Si';
                        if (['no', 'false'].includes(lower)) return 'No';
                        return val;
                    };

                    const normalizeObjective = (val: string) => {
                         if (!val) return null;
                         const lower = String(val).toLowerCase().trim();
                         if (lower.includes('protección') || lower.includes('proteccion') || lower.includes('familiar')) return 'Protección Familiar';
                         if (lower.includes('retiro')) return 'Ahorro para retiro';
                         if (lower.includes('hijos') || lower.includes('educación') || lower.includes('educacion')) return 'Educación para tus hijos';
                         return val;
                    };

                    if (analysis.main_objective && (!currentLead?.main_objective)) {
                        const normalized = normalizeObjective(analysis.main_objective);
                        if (normalized) leadUpdate.main_objective = normalized;
                    }

                    if (analysis.stable_income && (!currentLead?.stable_income)) {
                        const normalized = normalizeYesNo(analysis.stable_income);
                        if (normalized) leadUpdate.stable_income = normalized;
                    }

                    if (analysis.health_condition && (!currentLead?.health_condition)) {
                        const normalized = normalizeYesNo(analysis.health_condition);
                        if (normalized) leadUpdate.health_condition = normalized;
                    }
                    
                    if (Object.keys(leadUpdate).length > 0) {
                        await supabase.from('leads').update(leadUpdate).eq('id', leadId);
                    }

                    // CRITICAL: Stop calling if appointment scheduled
                    if (resData.scheduled_datetime) {
                        console.log(`Appointment scheduled for lead ${leadId} at ${resData.scheduled_datetime}. Stopping future calls.`);
                        
                        // 1. Deactivate Call Schedules
                        await supabase.from('call_schedules')
                            .update({ active: false })
                            .eq('lead_id', leadId);

                        // 2. Cancel Pending Jobs
                        await supabase.from('jobs')
                            .update({ status: 'CANCELLED' })
                            .eq('lead_id', leadId)
                            .in('status', ['PENDING', 'QUEUED']);

                        // 3. Log Event
                        await supabase.from('lead_events').insert({
                            lead_id: leadId,
                            event_type: 'orchestration.cancelled_by_appointment',
                            payload: { 
                                reason: 'appointment_confirmed', 
                                scheduled_at: resData.scheduled_datetime 
                            }
                        });
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
