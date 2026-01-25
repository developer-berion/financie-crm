import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, orchestrateLead } from "../shared-utils.ts";

serve(async (req) => {
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
        return new Response(JSON.stringify({ error: 'Invalid payload type' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    const lead = payload.record;
    
    console.log(`Orchestrating lead: ${lead.id} (${lead.full_name})`);
    
    await orchestrateLead(supabase, lead);

    return new Response(JSON.stringify({ success: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in orchestrate_lead:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
