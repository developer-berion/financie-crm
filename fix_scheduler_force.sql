
-- FIX SCHEDULER (Force Always On)
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Clean up old jobs to avoid duplicates
SELECT cron.unschedule('process-jobs-every-minute');

-- 3. Schedule the job securely with the proper key
-- This ensures the Edge Function is hit every minute to process pending calls.
SELECT cron.schedule(
    'process-jobs-every-minute',
    '* * * * *', -- Every minute
    $$
    SELECT net.http_post(
        url := 'https://cnkwnynujtyfslafsmug.supabase.co/functions/v1/process_jobs',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer sb_secret_9-JFDlGF1DM7wxS7z5BpuA_sUjCS-1J'
        ),
        body := '{}'::jsonb
    );
    $$
);

-- 4. Verify
SELECT * FROM cron.job;
