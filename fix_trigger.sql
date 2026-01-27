
-- Update the orchestration trigger with the specific Service Role Key to ensure it auths correctly
CREATE OR REPLACE FUNCTION public.tr_orchestrate_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  service_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNua3dueW51anR5ZnNsYWZzbXVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ4NjczNSwiZXhwIjoyMDUzMDYyNzM1fQ.9-JFDlGF1DM7wxS7z5BpuA_sUjCS-1J'; -- Key we retrieved earlier
BEGIN
  PERFORM net.http_post(
    url := 'https://cnkwnynujtyfslafsmug.supabase.co/functions/v1/orchestrate_lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
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
