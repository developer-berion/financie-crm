-- Add new fields for Meta/Make leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_created_at timestamptz;

-- Comment on columns
COMMENT ON COLUMN public.leads.state IS 'State/Region from the lead address';
COMMENT ON COLUMN public.leads.terms_accepted IS 'Whether the user accepted terms and conditions';
COMMENT ON COLUMN public.leads.meta_created_at IS 'Original creation timestamp from Meta/Facebook';
