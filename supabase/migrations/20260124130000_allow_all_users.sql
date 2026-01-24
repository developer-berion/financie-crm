-- Modify the helper function to allow any authenticated user
CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS boolean AS $$
BEGIN
  -- Allow any user with a valid session (authenticated role)
  RETURN (auth.role() = 'authenticated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
