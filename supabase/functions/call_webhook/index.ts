import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, verifyTwilioSignature } from "../shared-utils.ts";

const CALL_REJECTED_THRESHOLD_SECONDS = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient();
    const contentType = req.headers.get('content-type');
    
    let body;
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }

    console.log('Call Webhook received:', body);

    const { 
      CallSid, 
      From, 
      To, 
      CallStatus, 
      Duration,
      SequenceNumber,
      ErrorCode
    } = body;

    const status = CallStatus || 'unknown';
    const duration = parseInt(Duration || '0', 10);

    // 1. Log the integration event
    await supabase.from('integration_logs').insert({
      provider: 'twilio_call',
      status: status,
      payload_ref: body,
      message_safe: `Call status update: ${status}`
    });

    // 2. Resolve CRM Status
    let dbStatus: 'EXITOSA' | 'SIN_RESPUESTA' | 'RECHAZADA' | null = null;
    
    // Statuses: initiated, ringing, answered, completed, busy, no-answer, canceled, failed
    if (status === 'completed') {
        if (duration >= CALL_REJECTED_THRESHOLD_SECONDS) {
            dbStatus = 'EXITOSA';
        } else {
            dbStatus = 'RECHAZADA'; // Answered but hung up quickly
        }
    } else if (['no-answer', 'failed'].includes(status)) {
        dbStatus = 'SIN_RESPUESTA';
    } else if (['busy', 'canceled'].includes(status)) {
        dbStatus = 'RECHAZADA';
    }

    // 3. Find Lead
    const { data: existingEvent } = await supabase
        .from('call_events')
        .select('id, lead_id')
        .eq('call_sid', CallSid)
        .single();

    let leadId = existingEvent?.lead_id;

    if (!leadId) {
        // Try 'To' column for outbound calls
        const targetPhone = To;
        if (targetPhone) {
            const cleanPhone = targetPhone.replace('+', '');
            const { data: leads } = await supabase
                .from('leads')
                .select('id')
                .or(`phone.eq.${targetPhone},phone.eq.${cleanPhone}`)
                .limit(1);
            if (leads && leads.length > 0) leadId = leads[0].id;
        }
    }

    if (leadId) {
        // Upsert into call_events
        const eventData: any = {
            lead_id: leadId,
            call_sid: CallSid,
            status_raw: status,
            duration_seconds: duration,
            last_callback_payload: body,
        };

        if (dbStatus) eventData.status_crm = dbStatus;
        if (status === 'answered') eventData.answered_at = new Date().toISOString();
        if (['completed', 'busy', 'no-answer', 'canceled', 'failed'].includes(status)) {
            eventData.ended_at = new Date().toISOString();
        }

        await supabase.from('call_events').upsert(eventData, { onConflict: 'call_sid' });

        // Update lead global status
        if (dbStatus) {
            await supabase.from('leads').update({
                call_status: dbStatus.toLowerCase(),
                last_call_id: CallSid
            }).eq('id', leadId);
        }

        // --- NEW: Log detailed events to lead_events for Timeline ---
        let timelineEventType = '';
        let timelineDescription = '';

        if (status === 'initiated' || status === 'queued') {
            timelineEventType = 'call.initiated';
            timelineDescription = 'Llamada realizada';
        } else if (status === 'answered' || status === 'in-progress') {
            timelineEventType = 'call.answered';
            timelineDescription = 'Llamada Atendida';
        } else if (status === 'failed') {
            timelineEventType = 'call.failed';
            timelineDescription = 'Llamada no realizada por error';
        } else if (['busy', 'no-answer', 'canceled'].includes(status)) {
             timelineEventType = 'call.missed';
             timelineDescription = status === 'busy' ? 'Línea ocupada' : 'Llamada sin respuesta / Desviada';
        } else if (status === 'completed') {
             timelineEventType = 'call.completed';
             timelineDescription = `Llamada finalizada (${duration}s)`;
        }

        // Only log if we mapped a significant event
        if (timelineEventType) {
             await supabase.from('lead_events').insert({
                lead_id: leadId,
                event_type: timelineEventType,
                payload: { 
                    status: status, 
                    description: timelineDescription,
                    duration: duration,
                    call_sid: CallSid
                }
             });
        }

        // --- RESCHEDULING LOGIC ---
        // If call failed or was not answered, schedule next attempt according to rules:
        // 1. Retry 1 (5 min later)
        // 2. Retry 2 (5 min later)
        // 3. Move to next block (Next valid hour or next day)
        
        if (['no-answer', 'busy', 'failed', 'canceled'].includes(status)) {
             // Fetch active schedule
             const { data: schedule } = await supabase
                .from('call_schedules')
                .select('*')
                .eq('lead_id', leadId)
                .eq('active', true)
                .maybeSingle();

             if (schedule) {
                 const currentAttemptCount = schedule.attempts_today || 0;
                 const currentBlockRetry = schedule.retry_count_block || 0;
                 
                 let nextAttempt: Date | null = null;
                 let newBlockRetry = currentBlockRetry;
                 let newAttemptsToday = currentAttemptCount;

                 // Rule: Retry up to 3 times in a block (Initial + 2 retries)
                 if (currentBlockRetry < 2) {
                     // Retry in 5 minutes
                     nextAttempt = new Date();
                     nextAttempt.setMinutes(nextAttempt.getMinutes() + 5);
                     newBlockRetry++;
                     newAttemptsToday++;
                 } else {
                     // Move to next block logic
                     // For simplicity, we assume next block is +4 hours or next day if late
                     // Ideally use getSafeCallTime or similar, but simplified here:
                     nextAttempt = new Date();
                     const currentHour = nextAttempt.getHours();
                     
                     if (currentHour < 13) {
                         // Move to afternoon block (e.g. 1PM)
                         nextAttempt.setHours(13, 0, 0, 0);
                     } else if (currentHour < 18) {
                         // Move to evening block (e.g. 6PM)
                         nextAttempt.setHours(18, 0, 0, 0);
                     } else {
                         // Move to tomorrow morning (9AM)
                         nextAttempt.setDate(nextAttempt.getDate() + 1);
                         nextAttempt.setHours(9, 0, 0, 0);
                         newAttemptsToday = 0; // Reset for next day
                     }
                     newBlockRetry = 0; // Reset block retries
                 }

                 if (nextAttempt) {
                     console.log(`Rescheduling lead ${leadId} to ${nextAttempt.toISOString()}`);
                     
                     // Upsert schedule
                     await supabase.from('call_schedules').update({
                         next_attempt_at: nextAttempt.toISOString(),
                         attempts_today: newAttemptsToday,
                         retry_count_block: newBlockRetry,
                         updated_at: new Date().toISOString()
                     }).eq('id', schedule.id);

                     // Create new Job
                     await supabase.from('jobs').insert({
                         lead_id: leadId,
                         type: 'INITIAL_CALL', // Keep type same for now
                         scheduled_at: nextAttempt.toISOString(),
                         status: 'PENDING'
                     });

                     await supabase.from('lead_events').insert({
                        lead_id: leadId,
                        event_type: 'call.scheduled',
                        payload: { 
                            reason: 'retry_logic', 
                            trigger_status: status,
                            scheduled_to: nextAttempt.toISOString() 
                        }
                     });
                 }
             }
        } else if (status === 'completed' && duration > 10) {
            // Success - Mark schedule as inactive/fulfilled
             await supabase.from('call_schedules')
                .update({ active: false, last_attempt_at: new Date().toISOString() })
                .eq('lead_id', leadId);
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
