
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getCorrelationId, getSupabaseClient, logStructured, triggerCall } from "../shared-utils.ts";

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

  // DISABLED TEMPORARILY: Job processor (Automatic calls)
  logStructured('warn', 'process_jobs', 'disabled', { correlation_id: correlationId });
  return new Response(JSON.stringify({ 
      message: 'Job Processor is currently disabled by administrator.',
      correlation_id: correlationId,
  }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });

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
      return new Response(JSON.stringify({ message: 'No pending jobs', correlation_id: correlationId }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const results = [];

    // 2. Process each job
    for (const job of jobs) {
      logStructured('info', 'process_jobs', 'processing_job', {
        correlation_id: correlationId,
        job_id: job.id,
        lead_id: job.lead_id,
        type: job.type,
      });
      let success = false;
      let error = null;

      if (job.type === 'INITIAL_CALL') {
          // Trigger the call
          // Note: triggerCall internally calls 'make_outbound_call' function
          const callResult = await triggerCall(job.lead_id, correlationId);
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
              
              logStructured('warn', 'process_jobs', 'job_retry_scheduled', {
                correlation_id: correlationId,
                job_id: job.id,
                lead_id: job.lead_id,
                retry_count: currentRetry + 1,
                max_retries: maxRetries,
                next_attempt_at: nextAttempt.toISOString(),
                error,
              });

              await supabase.from('jobs').update({
                  status: 'PENDING',
                  retry_count: currentRetry + 1,
                  scheduled_at: nextAttempt.toISOString(),
                  error: `Attempt ${currentRetry + 1} failed: ${error}`
              }).eq('id', job.id);
          } else {
              logStructured('error', 'process_jobs', 'job_failed_permanently', {
                correlation_id: correlationId,
                job_id: job.id,
                lead_id: job.lead_id,
                retry_count: currentRetry,
                max_retries: maxRetries,
                error,
              });
              await supabase.from('jobs').update({
                  status: 'FAILED',
                  retry_count: currentRetry,
                  error: `Max retries exceeded. Last error: ${error}`
              }).eq('id', job.id);
          }
      }

      results.push({ job_id: job.id, success, error });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results, correlation_id: correlationId }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    logStructured('error', 'process_jobs', 'request_failed', {
      correlation_id: correlationId,
      error: errorMessage,
    });
    return new Response(JSON.stringify({ error: errorMessage, correlation_id: correlationId }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})
