-- Add marketing_consent column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN leads.marketing_consent IS 'Indicates if the lead has consented to marketing communications and automated calls';
