import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { COMMUNICATIONS_ENABLED, corsHeaders, getCorrelationId, getSupabaseClient, logStructured, safeLog, verifyElevenLabsSignature } from "../shared-utils.ts";

// CRM-001: Secret loaded ONLY from env var. No fallback. Fail fast.
const ELEVENLABS_WEBHOOK_SECRET = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET');
if (!ELEVENLABS_WEBHOOK_SECRET) {
  console.error('[FATAL] ELEVENLABS_WEBHOOK_SECRET env var is not set. Webhook will reject all requests.');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

serve(async (req) => {
  const correlationId = getCorrelationId(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!COMMUNICATIONS_ENABLED) {
      return new Response(
        JSON.stringify({ success: true, skipped: 'communications_disabled', correlation_id: correlationId }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!ELEVENLABS_WEBHOOK_SECRET) {
      return new Response('Server misconfigured: missing webhook secret', { status: 500 });
    }

    const supabase = getSupabaseClient();
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const signature = req.headers.get('elevenlabs-signature');

    safeLog('[ElevenLabs] Webhook received', { type: body.type, call_id: body.call_id });

    // 1. Validate Signature
    if (!signature || !(await verifyElevenLabsSignature(rawBody, signature, ELEVENLABS_WEBHOOK_SECRET))) {
      logStructured('warn', 'elevenlabs_webhook', 'invalid_signature', {
        correlation_id: correlationId,
      });
      return new Response('Unauthorized', { status: 401 });
    }

    const eventType = body.type || 'unknown';
    const callId = body.call_id || body.conversation_id;

    // 2. Log the integration event
    await supabase.from('integration_logs').insert({
      provider: 'elevenlabs',
      request_id: correlationId,
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
                            logStructured('info', 'elevenlabs_webhook', 'fetching_transcript_api', {
                              correlation_id: correlationId,
                              conversation_id: body.conversation_id,
                            });
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
                                     transcript = convData.transcript
                                        .map((t: { role?: string; message?: string }) => `${t.role || 'unknown'}: ${t.message || ''}`)
                                        .join('\n');
                                }
                            } else {
                                logStructured('error', 'elevenlabs_webhook', 'transcript_api_failed', {
                                  correlation_id: correlationId,
                                  conversation_id: body.conversation_id,
                                  status: convResp.status,
                                  body: await convResp.text(),
                                });
                            }
                         } catch (err) {
                             logStructured('error', 'elevenlabs_webhook', 'transcript_api_exception', {
                               correlation_id: correlationId,
                               conversation_id: body.conversation_id,
                               error: getErrorMessage(err),
                             });
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
                    const leadUpdate: Record<string, unknown> = {};
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
                        logStructured('info', 'elevenlabs_webhook', 'appointment_detected_stopping_calls', {
                          correlation_id: correlationId,
                          lead_id: leadId,
                          scheduled_at: resData.scheduled_datetime,
                        });
                        
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
                                scheduled_at: resData.scheduled_datetime,
                                correlation_id: correlationId,
                            }
                        });
                    }

            // Log event
            await supabase.from('lead_events').insert({
                lead_id: leadId,
                event_type: 'conversation.completed',
                payload: {
                    ...body,
                    correlation_id: correlationId,
                }
            });

        } else if (eventType === 'call_initiation_failed') {
            await supabase.from('lead_events').insert({
                lead_id: leadId,
                event_type: 'conversation.failed_initiation',
                payload: {
                    ...body,
                    correlation_id: correlationId,
                }
            });
        }
    }

    return new Response(
      JSON.stringify({ success: true, correlation_id: correlationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logStructured('error', 'elevenlabs_webhook', 'webhook_failed', {
      correlation_id: correlationId,
      error: errorMessage,
    });
    return new Response(
      JSON.stringify({ error: errorMessage, correlation_id: correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
