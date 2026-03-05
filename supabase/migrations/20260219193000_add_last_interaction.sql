-- Add column for tracking last interaction
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for performance on sorting/filtering
CREATE INDEX IF NOT EXISTS idx_leads_last_interaction ON leads(last_interaction_at);

-- Create Function to update timestamp on new event
CREATE OR REPLACE FUNCTION public.update_lead_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if lead_id is present
    IF NEW.lead_id IS NOT NULL THEN
        UPDATE public.leads
        SET last_interaction_at = NEW.created_at
        WHERE id = NEW.lead_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Create Trigger on lead_events
DROP TRIGGER IF EXISTS on_lead_event_created ON public.lead_events;
CREATE TRIGGER on_lead_event_created
AFTER INSERT ON public.lead_events
FOR EACH ROW
EXECUTE FUNCTION update_lead_last_interaction();
