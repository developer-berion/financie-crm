-- Migration: 20260124151500_setup_orchestration_trigger.sql
-- Description: Create a trigger to call the orchestrate_lead function on lead insert

-- 1. Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.tr_orchestrate_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- We use the net.http_post from pg_net to call our Edge Function asynchronously
  -- We need the SUPABASE_URL and SERVICE_ROLE_KEY to call it securely.
  -- In Supabase, we can use the project-specific URL.
  -- Note: Replace [PROJECT_ID] with the actual ID.
  
  PERFORM net.http_post(
    url := 'https://cnkwnynujtyfslafsmug.supabase.co/functions/v1/orchestrate_lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'leads',
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. The Trigger
DROP TRIGGER IF EXISTS tr_orchestrate_new_lead ON public.leads;
CREATE TRIGGER tr_orchestrate_new_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.tr_orchestrate_new_lead();

-- 4. Note on app.settings.service_role_key
-- We need to ensure the service role key is available to the SQL environment.
-- Since we can't easily pass it via migration without knowing it, 
-- we can alternatively use a Webhook created via Supabase Dashboard UI 
-- or use a pre-set variable.
-- For this environment, I will assume the user has set the secret or I will use a different approach.

-- ALTERNATIVE: Use Supabase Hooks (if available via CLI/UI)
-- But for now, I'll provide the SQL structure.
