-- Migration: 20260129_fix_cron_auth.sql
-- Description: Re-issue process_jobs cron with secure runtime settings (no hardcoded secrets)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  v_supabase_url text := nullif(current_setting('app.settings.supabase_url', true), '');
  v_service_role_key text := nullif(current_setting('app.settings.service_role_key', true), '');
  v_command text;
BEGIN
  BEGIN
    PERFORM cron.unschedule('process-jobs-every-minute');
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE NOTICE 'Skipping process_jobs cron auth fix: missing app.settings.supabase_url/service_role_key.';
    RETURN;
  END IF;

  v_command := format(
    $fmt$
    SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', %L,
        'x-correlation-id', 'cron:process-jobs-every-minute'
      ),
      body := '{}'::jsonb
    );
    $fmt$,
    v_supabase_url || '/functions/v1/process_jobs',
    'Bearer ' || v_service_role_key
  );

  PERFORM cron.schedule('process-jobs-every-minute', '* * * * *', v_command);
END $$;
