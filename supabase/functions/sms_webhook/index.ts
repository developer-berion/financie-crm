import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getCorrelationId, getSupabaseClient, logStructured, safeLog, verifyTwilioSignature } from "../shared-utils.ts";

interface SmsEventUpdate {
  lead_id: string;
  message_sid: string;
  status_raw: string;
  last_callback_payload: Record<string, string>;
  status_crm?: string;
  delivered_at?: string;
  failed_at?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function normalizePayload(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const normalized: Record<string, string> = {};
  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    normalized[key] = value === null || value === undefined ? '' : String(value);
  });
  return normalized;
}

serve(async (req) => {
  const correlationId = getCorrelationId(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient();
    
    // 0. Parse body first (needed for signature verification)
    let body: Record<string, string>;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        body = normalizePayload(await req.json());
    } else {
        const formData = await req.formData();
        body = normalizePayload(Object.fromEntries(formData.entries()));
    }

    // CRM-002: Validate Twilio Signature (ENABLED)
    const signature = req.headers.get('x-twilio-signature');
    const authToken = Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN') || Deno.env.get('SMS_TWILIO_AUTH_TOKEN') || '';
    const requestUrl = req.url;
    
    if (authToken) {
        if (!signature || !(await verifyTwilioSignature(requestUrl, body, signature, authToken))) {
            logStructured('warn', 'sms_webhook', 'invalid_twilio_signature', { correlation_id: correlationId });
            return new Response('Forbidden', { status: 403, headers: corsHeaders });
        }
    } else {
        logStructured('warn', 'sms_webhook', 'signature_verification_skipped', { correlation_id: correlationId });
    }

    safeLog('[SMS Webhook] Received', { MessageSid: body.MessageSid, SmsStatus: body.SmsStatus || body.MessageStatus });

    const { 
      MessageSid, 
      From, 
      To, 
      Body: MessageBody, 
      SmsStatus, 
      MessageStatus,
      ErrorCode
    } = body;

    // --- BLACKLIST CHECK ---
    if (From) {
        const { data: blacklistSetting } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'SMS_BLACKLIST')
            .maybeSingle();

        if (blacklistSetting?.value) {
            const blacklistedNumbers = blacklistSetting.value.split(',').map((n: string) => n.trim());
            const cleanFrom = From.replace(/\D/g, ''); // Clean to digits only
            
            const isBlacklisted = blacklistedNumbers.some((n: string) => {
                const cleanN = n.replace(/\D/g, '');
                return cleanN === cleanFrom && cleanN.length > 0;
            });

            if (isBlacklisted) {
                logStructured('info', 'sms_webhook', 'blacklist_blocked', {
                    correlation_id: correlationId,
                    from: From,
                });
                // Return valid empty TwiML to Twilio so it doesn't retry
                return new Response(
                    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
                    { 
                        headers: { 
                            ...corsHeaders, 
                            'Content-Type': 'application/xml text/xml' 
                        } 
                    }
                );
            }
        }
    }
    // -----------------------

    const status = SmsStatus || MessageStatus || 'received';

    // 1. Log the integration event
    await supabase.from('integration_logs').insert({
      provider: 'twilio',
      request_id: correlationId,
      status: status,
      payload_ref: body,
      message_safe: MessageBody ? `SMS from ${From}: ${MessageBody.substring(0, 50)}...` : `Status update: ${status}`
    });

    // 2. Map statuses for CRM
    let dbStatus: 'RECIBIDO' | 'NO_ENVIADO' | 'NO_RECIBIDO' | null = null;
    
    if (['delivered'].includes(status)) {
        dbStatus = 'RECIBIDO';
    } else if (['failed', 'undelivered'].includes(status) || ErrorCode) {
        dbStatus = 'NO_ENVIADO';
    } else if (['sent', 'queued', 'sending'].includes(status)) {
        // We don't map to a terminal CRM status yet, but we track it in sms_events
    }

    // 3. Update or Create sms_events record
    const { data: existingEvent } = await supabase
        .from('sms_events')
        .select('id, lead_id')
        .eq('message_sid', MessageSid)
        .single();

    let leadId = existingEvent?.lead_id;

    if (!leadId) {
        // Try to find lead by phone number (To for outbound, From for inbound)
        const isOutbound = !!MessageStatus || ['sent', 'delivered', 'undelivered', 'failed'].includes(status);
        const targetPhone = isOutbound ? To : From;
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
        // Upsert into sms_events
        const eventData: SmsEventUpdate = {
            lead_id: leadId,
            message_sid: MessageSid,
            status_raw: status,
            last_callback_payload: body,
        };

        if (dbStatus) eventData.status_crm = dbStatus;
        if (status === 'delivered') eventData.delivered_at = new Date().toISOString();
        if (['failed', 'undelivered'].includes(status)) eventData.failed_at = new Date().toISOString();

        await supabase.from('sms_events').upsert(eventData, { onConflict: 'message_sid' });

        // 4. Update lead global status
        if (dbStatus) {
            await supabase.from('leads').update({
                message_status: dbStatus.toLowerCase(),
                last_message_sid: MessageSid
            }).eq('id', leadId);
        }

        // 5. Orchestration: Schedule Call if this is the first "sent" status
        if (['sent', 'queued'].includes(status)) {
            // Check if a job already exists to avoid duplicates
            const { data: existingJobs } = await supabase
                .from('jobs')
                .select('id')
                .eq('lead_id', leadId)
                .eq('type', 'INITIAL_CALL')
                .limit(1);

            if (!existingJobs || existingJobs.length === 0) {
                // Schedule call for 5 minutes from now
                const scheduledAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
                await supabase.from('jobs').insert({
                    lead_id: leadId,
                    type: 'INITIAL_CALL',
                    scheduled_at: scheduledAt,
                    status: 'PENDING'
                });
                logStructured('info', 'sms_webhook', 'followup_call_scheduled', {
                    correlation_id: correlationId,
                    lead_id: leadId,
                    scheduled_at: scheduledAt,
                });
            }
        }
    }

    return new Response(
      JSON.stringify({ success: true, correlation_id: correlationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStructured('error', 'sms_webhook', 'fatal_error', {
      correlation_id: correlationId,
      error: getErrorMessage(error),
    });
    return new Response(
      JSON.stringify({ error: getErrorMessage(error), correlation_id: correlationId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
