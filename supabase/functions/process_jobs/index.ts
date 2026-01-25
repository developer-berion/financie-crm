
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, triggerCall } from "../shared-utils.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = getSupabaseClient();
  
  try {
    // 1. Fetch pending jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'PENDING')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10); // Batch size

    if (jobsError) throw jobsError;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending jobs' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const results = [];

    // 2. Process each job
    for (const job of jobs) {
      console.log(`Processing job ${job.id} for lead ${job.lead_id}`);
      let success = false;
      let error = null;

      if (job.type === 'INITIAL_CALL') {
          // Trigger the call
          // Note: triggerCall internally calls 'make_outbound_call' function
          const callResult = await triggerCall(job.lead_id);
          success = callResult.success;
          error = callResult.error;
      } else {
          error = `Unknown job type: ${job.type}`;
      }

      // 3. Update job status
      await supabase.from('jobs').update({
          status: success ? 'COMPLETED' : 'FAILED',
          error: error
      }).eq('id', job.id);

      results.push({ job_id: job.id, success, error });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in process_jobs:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
