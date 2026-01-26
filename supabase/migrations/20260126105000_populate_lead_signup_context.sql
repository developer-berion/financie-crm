-- Migration: Add automatic signup date/time trigger

-- 1. Create the function that calculates context based on state
CREATE OR REPLACE FUNCTION public.populate_lead_signup_context()
RETURNS TRIGGER AS $$
DECLARE
    v_tz text;
    v_state text;
BEGIN
    -- Normalize state input
    v_state := lower(trim(COALESCE(NEW.state, '')));
    
    -- Default timezone to Eastern Time (EST/EDT)
    v_tz := 'America/New_York';
    
    -- Map known states to timezones
    -- Florida is already America/New_York by default, but we list it for clarity if logic changes
    IF v_state IN ('ca', 'california') THEN
        v_tz := 'America/Los_Angeles';
    ELSIF v_state IN ('fl', 'florida') THEN
        v_tz := 'America/New_York';
    -- Add more states if necessary, or rely on shared-utils.ts for complex mapping logic in Edge Functions 
    -- if we wanted full US coverage here, it would be a large CASE statement. 
    -- For now, covering the requested specific cases (FL, CA) and defaulting to EST.
    END IF;

    -- Only populate if currently null (allows manual override)
    IF NEW.signup_date IS NULL THEN
        -- Format Date: "26 de enero" (Spanish months)
        NEW.signup_date := to_char(NEW.created_at AT TIME ZONE v_tz, 'DD "de" ') || 
            CASE extract(month from NEW.created_at AT TIME ZONE v_tz)
                WHEN 1 THEN 'enero' WHEN 2 THEN 'febrero' WHEN 3 THEN 'marzo'
                WHEN 4 THEN 'abril' WHEN 5 THEN 'mayo' WHEN 6 THEN 'junio'
                WHEN 7 THEN 'julio' WHEN 8 THEN 'agosto' WHEN 9 THEN 'septiembre'
                WHEN 10 THEN 'octubre' WHEN 11 THEN 'noviembre' WHEN 12 THEN 'diciembre'
            END;
    END IF;
        
    IF NEW.signup_time IS NULL THEN
        -- Format Time: "10:48 AM"
        NEW.signup_time := to_char(NEW.created_at AT TIME ZONE v_tz, 'HH12:MI AM');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_populate_lead_signup_context ON public.leads;

CREATE TRIGGER tr_populate_lead_signup_context
    BEFORE INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.populate_lead_signup_context();
