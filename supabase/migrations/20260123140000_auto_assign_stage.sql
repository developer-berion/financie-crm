-- Function to assign default stage
CREATE OR REPLACE FUNCTION public.handle_new_lead_stage()
RETURNS TRIGGER AS $$
DECLARE
    default_stage_id uuid;
BEGIN
    -- Find the 'Lead Nuevo (Meta)' stage or just the first one by sort_order
    SELECT id INTO default_stage_id
    FROM public.pipeline_stages
    WHERE name = 'Lead Nuevo (Meta)'
    ORDER BY sort_order ASC
    LIMIT 1;

    -- Fallback if specific name not found
    IF default_stage_id IS NULL THEN
        SELECT id INTO default_stage_id
        FROM public.pipeline_stages
        ORDER BY sort_order ASC
        LIMIT 1;
    END IF;

    -- Set the stage_id
    NEW.stage_id := default_stage_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS tr_handle_new_lead_stage ON public.leads;
CREATE TRIGGER tr_handle_new_lead_stage
    BEFORE INSERT ON public.leads
    FOR EACH ROW
    WHEN (NEW.stage_id IS NULL)
    EXECUTE FUNCTION public.handle_new_lead_stage();

-- Backfill existing leads that have NULL stage_id
DO $$
DECLARE
    default_stage_id uuid;
BEGIN
    SELECT id INTO default_stage_id
    FROM public.pipeline_stages
    WHERE name = 'Lead Nuevo (Meta)'
    ORDER BY sort_order ASC
    LIMIT 1;

    IF default_stage_id IS NOT NULL THEN
        UPDATE public.leads
        SET stage_id = default_stage_id
        WHERE stage_id IS NULL;
    END IF;
END $$;
