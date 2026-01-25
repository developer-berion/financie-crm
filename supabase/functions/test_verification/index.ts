
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient } from "../shared-utils.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getSupabaseClient();
    const { action, lead_data } = await req.json();

    if (action === 'check_logs') {
        const { data, error } = await supabase
            .from('integration_logs')
            .select('*')
            .eq('provider', 'twilio')
            .order('created_at', { ascending: false })
            .limit(5);

        return new Response(JSON.stringify({ success: true, logs: data, error }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
