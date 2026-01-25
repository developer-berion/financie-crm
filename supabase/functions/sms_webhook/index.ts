import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, verifyTwilioSignature } from "../shared-utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient();
    
    // 0. Validate Twilio Signature (Optional but recommended)
    const signature = req.headers.get('x-twilio-signature');
    const authToken = Deno.env.get('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN') || '';
    const url = req.url; // May need adjustment if behind proxy
    
    // For now, we logging but proceed. In production, return 401 if invalid.
    /*
    if (signature && !(await verifyTwilioSignature(url, body, signature, authToken))) {
        console.warn('Invalid Twilio Signature');
        // return new Response('Forbidden', { status: 403 });
    }
    */

    let body;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        body = await req.json();
    } else {
        const formData = await req.formData();
        body = {};
        formData.forEach((value, key) => {
            body[key] = value;
        });
    }

    console.log('SMS Webhook received:', body);

    const { 
      MessageSid, 
      From, 
      To, 
      Body: MessageBody, 
      SmsStatus, 
      MessageStatus,
      ErrorCode
    } = body;

    const status = SmsStatus || MessageStatus || 'received';

    // 1. Log the integration event
    await supabase.from('integration_logs').insert({
      provider: 'twilio',
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
        const eventData: any = {
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
                console.log(`Scheduled follow-up call for lead ${leadId} at ${scheduledAt}`);
            }
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
