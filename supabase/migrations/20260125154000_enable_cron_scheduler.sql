-- Migration: 20260125154000_enable_cron_scheduler.sql
-- Description: Enable pg_cron and schedule the process_jobs dispatcher

-- 1. Enable pg_cron extension (requires superuser, standard in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the job to run every minute
-- We use net.http_post to hit the Edge Function
-- Note: 'app.settings.service_role_key' MUST be set for this to work.
SELECT cron.schedule(
    'process-jobs-every-minute',
    '* * * * *',
    $$
    SELECT net.http_post(
        url := 'https://cnkwnynujtyfslafsmug.supabase.co/functions/v1/process_jobs',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
    );
    $$
);
