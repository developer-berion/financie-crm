-- Migration: Add stage_updated_at tracking to leads
-- This migration adds a column to track how long a lead has been in its current pipeline stage.

-- 1. Add column
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz DEFAULT now();

-- 2. Initialize existing leads
UPDATE public.leads 
SET stage_updated_at = created_at 
WHERE stage_updated_at IS NULL;

-- 3. Create function to update stage timestamp
CREATE OR REPLACE FUNCTION public.fn_update_stage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the stage_id actually changed
    IF (OLD.stage_id IS DISTINCT FROM NEW.stage_id) THEN
        NEW.stage_updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS tr_update_stage_timestamp ON public.leads;
CREATE TRIGGER tr_update_stage_timestamp
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_stage_timestamp();

COMMENT ON COLUMN public.leads.stage_updated_at IS 'Tracks the last time the lead changed its pipeline stage.';
