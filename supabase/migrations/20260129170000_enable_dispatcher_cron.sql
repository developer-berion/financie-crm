-- Migration: 20260129_enable_dispatcher_cron.sql
-- Description: Schedule call_dispatcher with secure runtime settings

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  v_supabase_url text := nullif(current_setting('app.settings.supabase_url', true), '');
  v_service_role_key text := nullif(current_setting('app.settings.service_role_key', true), '');
  v_command text;
BEGIN
  BEGIN
    PERFORM cron.unschedule('call-dispatcher-check');
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE NOTICE 'Skipping call_dispatcher schedule: missing app.settings.supabase_url/service_role_key.';
    RETURN;
  END IF;

  v_command := format(
    $fmt$
    SELECT net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', %L,
        'x-correlation-id', 'cron:call-dispatcher-check'
      ),
      body := '{}'::jsonb
    );
    $fmt$,
    v_supabase_url || '/functions/v1/call_dispatcher',
    'Bearer ' || v_service_role_key
  );

  PERFORM cron.schedule('call-dispatcher-check', '*/10 * * * *', v_command);
END $$;
