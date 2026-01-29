-- Migration: 20260129_fix_cron_auth.sql
-- Description: Unschedule the broken process_jobs cron and reschedule it with the correct hardcoded Service Role Key (similar to call_dispatcher).

-- 1. Unschedule the old broken job
SELECT cron.unschedule('process-jobs-every-minute');

-- 2. Reschedule with valid Authorization header
SELECT cron.schedule(
    'process-jobs-every-minute', -- job name
    '* * * * *',                 -- every minute
    $$
    SELECT net.http_post(
        url := 'https://cnkwnynujtyfslafsmug.supabase.co/functions/v1/process_jobs',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer sb_secret_9-JFDlGF1DM7wxS7z5BpuA_sUjCS-1J' -- Using the verified Service Role Key
        ),
        body := '{}'::jsonb
    );
    $$
);
