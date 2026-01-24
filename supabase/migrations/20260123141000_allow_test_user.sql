-- Add another allowed email for testing
INSERT INTO public.app_settings (key, value) 
VALUES ('allowed_email_test', 'test@financiegroup.com')
ON CONFLICT (key) DO UPDATE SET value = 'test@financiegroup.com';

-- Modify the helper function to allow any email that exists in app_settings (starting with 'allowed_email')
CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT count(*) > 0
    FROM public.app_settings
    WHERE key LIKE 'allowed_email%'
    AND value = (auth.jwt() ->> 'email')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
