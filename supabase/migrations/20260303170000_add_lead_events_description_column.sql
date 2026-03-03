-- Migration: 20260303170000_add_lead_events_description_column.sql
-- Purpose: Restore backward compatibility for legacy lead_events inserts that still write `description`.

ALTER TABLE public.lead_events
ADD COLUMN IF NOT EXISTS description text;

-- Backfill description from payload where available to keep timeline readability.
UPDATE public.lead_events
SET description = payload->>'description'
WHERE description IS NULL
  AND payload ? 'description';
