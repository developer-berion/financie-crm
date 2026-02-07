
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, triggerCall } from "../shared-utils.ts";

serve(async (req) => {
  // DISABLED TEMPORARILY: Job processor (Automatic calls)
  return new Response(JSON.stringify({ 
      message: 'Job Processor is currently disabled by administrator.' 
  }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });

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
      // 3. Update job status with Retry Logic
      if (success) {
          await supabase.from('jobs').update({
              status: 'COMPLETED',
              error: null
          }).eq('id', job.id);
      } else {
          const currentRetry = job.retry_count || 0;
          const maxRetries = 3;
          
          if (currentRetry < maxRetries) {
              const nextAttempt = new Date();
              nextAttempt.setMinutes(nextAttempt.getMinutes() + 5);
              
              console.log(`Job ${job.id} failed. Retrying (${currentRetry + 1}/${maxRetries}) at ${nextAttempt.toISOString()}`);

              await supabase.from('jobs').update({
                  status: 'PENDING',
                  retry_count: currentRetry + 1,
                  scheduled_at: nextAttempt.toISOString(),
                  error: `Attempt ${currentRetry + 1} failed: ${error}`
              }).eq('id', job.id);
          } else {
              console.log(`Job ${job.id} failed permanently after ${maxRetries} retries.`);
              await supabase.from('jobs').update({
                  status: 'FAILED',
                  retry_count: currentRetry,
                  error: `Max retries exceeded. Last error: ${error}`
              }).eq('id', job.id);
          }
      }

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
