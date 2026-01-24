import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient } from "../shared-utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient();
    const contentType = req.headers.get('content-type');
    
    // Twilio sends data as application/x-www-form-urlencoded
    let body;
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }

    console.log('SMS Webhook received:', body);

    const { 
      MessageSid, 
      From, 
      To, 
      Body, 
      SmsStatus, 
      AccountSid 
    } = body;

    // 1. Log the integration event
    await supabase.from('integration_logs').insert({
      provider: 'twilio',
      external_id: MessageSid,
      status: SmsStatus || 'received',
      payload_ref: body,
      message_safe: `SMS from ${From}: ${Body?.substring(0, 50)}...`
    });

    // 2. Find the lead associated with the phone number
    // Clean phone number for matching (remove + prefix if needed)
    const cleanPhone = From?.replace('+', '');
    
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .or(`phone.eq.${From},phone.eq.${cleanPhone}`)
      .limit(1);

    if (leads && leads.length > 0) {
      const leadId = leads[0].id;

      // 3. Log lead event
      await supabase.from('lead_events').insert({
        lead_id: leadId,
        event_type: 'sms.received',
        payload: {
          from: From,
          body: Body,
          sid: MessageSid
        }
      });
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
