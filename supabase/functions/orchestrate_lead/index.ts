import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getCorrelationId, getSupabaseClient, logStructured, orchestrateLead, safeLog } from "../shared-utils.ts";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

serve(async (req) => {
  const correlationId = getCorrelationId(req);

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = getSupabaseClient();
  
  try {
    const payload = await req.json();
    
    // Supabase DB Webhook payload format:
    // { type: 'INSERT', table: 'leads', record: { ... }, schema: 'public', old_record: null }
    if (payload.type !== 'INSERT' || payload.table !== 'leads') {
        logStructured('warn', 'orchestrate_lead', 'invalid_payload', {
          correlation_id: correlationId,
          payload_type: payload.type,
          payload_table: payload.table,
        });
        return new Response(JSON.stringify({ error: 'Invalid payload type', correlation_id: correlationId }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    const lead = payload.record;
    
    safeLog(`[Orchestrate] Processing lead: ${lead.id}`);
    logStructured('info', 'orchestrate_lead', 'start', {
      correlation_id: correlationId,
      lead_id: lead.id,
    });
    
    await orchestrateLead(supabase, lead, correlationId);

    return new Response(JSON.stringify({ success: true, correlation_id: correlationId }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logStructured('error', 'orchestrate_lead', 'request_failed', {
      correlation_id: correlationId,
      error: errorMessage,
    });
    return new Response(JSON.stringify({ error: errorMessage, correlation_id: correlationId }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
