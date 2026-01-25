import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, verifyMetaSignature } from "../shared-utils.ts";

serve(async (req) => {
  // 1. Verify Request
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('META_VERIFY_TOKEN')) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method === 'POST') {
    // 2. Validate Signature
    const signature = req.headers.get('x-hub-signature-256');
    const bodyText = await req.text();
    const isValid = await verifyMetaSignature(bodyText, signature || '', Deno.env.get('META_APP_SECRET') || '');

    const supabase = getSupabaseClient();
    
    // Log the integration attempt
    await supabase.from('integration_logs').insert({
      provider: 'meta',
      status: isValid ? 'success' : 'failure', 
      message_safe: isValid ? 'Payload received' : 'Invalid Signature',
      payload_ref: isValid ? JSON.parse(bodyText) : { error: 'Invalid config' } 
    })

    if (!isValid) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const payload = JSON.parse(bodyText);
      // Meta structure: entry -> changes -> value -> leadgen_id
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value || !value.leadgen_id) {
         return new Response('No leadgen_id found', { status: 200 });
      }
      
      const leadgenId = value.leadgen_id;
      
      // 3. Fetch Lead Details from Graph API
      const accessToken = Deno.env.get('META_ACCESS_TOKEN');
      const graphUrl = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`;
      const graphRes = await fetch(graphUrl);
      const leadData = await graphRes.json();

      if (!leadData.id) {
         console.error('Failed to fetch lead data', leadData);
         return new Response('Failed to fetch lead details', { status: 500 });
      }

      // 4. Map & Upsert Lead
      // Expected fields from Meta (depends on form): full_name, phone_number, email
      // We assume fields come mapped as "key/value" or we map by known keys
      // Simplification: We iterate field_data
      const fieldData = leadData.field_data || [];
      const getField = (name: string) => fieldData.find((f: any) => f.name === name)?.values?.[0] || '';
      
      // Heuristic for standard fields
      const fullName = getField('full_name') || getField('name') || 'Unknown Lead';
      const phone = getField('phone_number') || getField('phone');
      const email = getField('email');
      const state = getField('state') || getField('region');
      
      // Note: Terms are implicit if they submitted the form, but we can check if there's a specific field.
      // Usually Meta doesn't send a "terms" field unless custom. We default to true if it comes from here.
      const termsAccepted = true; 
      const metaCreatedAt = leadData.created_time; // Standard Meta field

      if (!phone) {
        // Without phone, we can't reliably process call logic (or strict constraint)
        // We insert anyway but mark as Check
      }

      // Upsert by phone (deduplication)
      // Check existing
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('phone', phone)
        .single();
      
      let leadId;
      let eventType = 'lead.received.meta';

      if (existingLead) {
        leadId = existingLead.id;
        eventType = 'lead.updated_possible_duplicate';
        await supabase.from('leads').update({
            updated_at: new Date().toISOString(),
            state: state,
            meta_created_at: metaCreatedAt
            // optionally update other fields?
        }).eq('id', leadId);
      } else {
        const { data: newLead, error: insertError } = await supabase.from('leads').insert({
            full_name: fullName,
            phone: phone,
            email: email,
            meta_lead_id: leadgenId,
            source: 'meta',
            status: 'Nuevo',
            state: state,
            terms_accepted: termsAccepted,
            meta_created_at: metaCreatedAt
            // Default stage? We let default value handle it or fetch the ID of "Lead Nuevo"
        }).select().single();
        
        if (insertError) throw insertError;
        leadId = newLead.id;
      }

      // 5. Create Event
      await supabase.from('lead_events').insert({
        lead_id: leadId,
        event_type: eventType,
        payload: leadData
      });

      // NOTE: Orchestration (SMS & Call Scheduling) is now handled automatically 
      // by a Database Trigger `tr_orchestrate_new_lead` calling the `orchestrate_lead` Edge Function.
      // This ensures it works even if the lead is inserted via Make.com or manually.

    } catch (e) {
      console.error(e);
      // Always return 200 to Meta so they don't retry endlessly on logic errors
      // Log error in integration_logs (update)
    }

    return new Response('Processed', { status: 200, headers: corsHeaders });
  }

  return new Response('Method Not Allowed', { status: 405 });
});
