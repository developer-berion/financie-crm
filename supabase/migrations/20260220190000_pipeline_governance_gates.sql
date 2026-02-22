-- Function to enforce business rules before a lead enters a new stage
CREATE OR REPLACE FUNCTION check_lead_stage_gates()
RETURNS TRIGGER AS $$
DECLARE
    new_stage_name TEXT;
BEGIN
    -- Only run logic if the stage_id has changed
    IF NEW.stage_id IS NOT NULL AND NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
        -- Get the new stage name
        SELECT name INTO new_stage_name FROM pipeline_stages WHERE id = NEW.stage_id;
        
        -- Rule 1: Propuesta requires estimated_value > 0
        IF new_stage_name = 'Propuesta' THEN
            IF COALESCE(NEW.estimated_value, 0) <= 0 THEN
                RAISE EXCEPTION 'MISSING_FIELDS:[{"field": "estimated_value"}]';
            END IF;
        END IF;

        -- Rule 2: Cerrado Ganado requires contract_signed = true and contract_url
        IF new_stage_name = 'Cerrado Ganado' THEN
            IF NEW.contract_details IS NULL OR 
               COALESCE(NEW.contract_details->>'contract_signed', 'false') != 'true' OR 
               COALESCE(NEW.contract_details->>'contract_url', '') = '' THEN
                RAISE EXCEPTION 'MISSING_FIELDS:[{"field": "contract_signed"}, {"field": "contract_url"}]';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_check_lead_stage_gates ON leads;
CREATE TRIGGER tr_check_lead_stage_gates
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION check_lead_stage_gates();
