-- Migration: 20260129_enable_dispatcher_cron.sql
-- Description: Schedule call_dispatcher to run every 10 minutes to handle block logic

-- Enable pg_cron extension if not enabled (should already be)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the dispatcher job
SELECT cron.schedule(
    'call-dispatcher-check', -- job name
    '*/10 * * * *',          -- every 10 minutes
    $$
    SELECT net.http_post(
        url := 'https://cnkwnynujtyfslafsmug.supabase.co/functions/v1/call_dispatcher',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer sb_secret_9-JFDlGF1DM7wxS7z5BpuA_sUjCS-1J' -- Replace with service key if needed, or use anon/service role logic
        ),
        body := '{}'::jsonb
    );
    $$
);
