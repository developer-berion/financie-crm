-- Add formatted context columns for easier visibility in the CRM/Database
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS signup_date text,
ADD COLUMN IF NOT EXISTS signup_time text;

-- Comment on columns
COMMENT ON COLUMN public.leads.signup_date IS 'Formatted date of lead signup (e.g., "25 de enero")';
COMMENT ON COLUMN public.leads.signup_time IS 'Formatted time of lead signup in lead timezone (e.g., "11:21 PM")';
