-- Add retry_count_block to call_schedules to track attempts within a time block
ALTER TABLE call_schedules ADD COLUMN IF NOT EXISTS retry_count_block INTEGER DEFAULT 0;

COMMENT ON COLUMN call_schedules.retry_count_block IS 'Tracks number of call attempts within the current time block (9am, 1pm, 7pm). Resets on block change.';
