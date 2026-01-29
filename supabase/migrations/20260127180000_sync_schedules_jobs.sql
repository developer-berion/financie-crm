
-- Migration: 20260127180000_sync_schedules_jobs.sql
-- Description: Sync call_schedules changes to jobs table automatically

-- Function to handle the sync logic
CREATE OR REPLACE FUNCTION public.sync_jobs_from_schedule()
RETURNS TRIGGER AS $$
DECLARE
    existing_job_id uuid;
BEGIN
    -- Only proceed if the schedule is ACTIVE (or became active)
    -- If it became INACTIVE, we should cancel pending jobs
    
    -- CASE 1: Schedule is Active (and was inserted or updated)
    IF NEW.active = true THEN
        -- Check if there is already a PENDING job for this lead of type INITIAL_CALL (or generic)
        -- We assume one pending call job per lead for simplicity in this context
        SELECT id INTO existing_job_id
        FROM public.jobs
        WHERE lead_id = NEW.lead_id
          AND status = 'PENDING'
          AND type = 'INITIAL_CALL'
        LIMIT 1;

        IF existing_job_id IS NOT NULL THEN
            -- Update existing job
            UPDATE public.jobs
            SET scheduled_at = NEW.next_attempt_at,
                updated_at = now()
            WHERE id = existing_job_id;
        ELSE
            -- Create new job
            INSERT INTO public.jobs (lead_id, type, scheduled_at, status)
            VALUES (NEW.lead_id, 'INITIAL_CALL', NEW.next_attempt_at, 'PENDING');
        END IF;

    -- CASE 2: Schedule became INACTIVE (e.g. cancelled by user)
    ELSIF NEW.active = false AND (OLD.active = true OR OLD.active IS NULL) THEN
        -- Cancel any PENDING jobs
        UPDATE public.jobs
        SET status = 'CANCELLED',
            updated_at = now(),
            error = 'Schedule cancelled by user/system'
        WHERE lead_id = NEW.lead_id
          AND status = 'PENDING'
          AND type = 'INITIAL_CALL';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_schedule_change ON public.call_schedules;

CREATE TRIGGER on_schedule_change
    AFTER INSERT OR UPDATE ON public.call_schedules
    FOR EACH ROW
    EXECUTE PROCEDURE public.sync_jobs_from_schedule();
