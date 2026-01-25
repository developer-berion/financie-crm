
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_logs' AND column_name = 'external_id') THEN
        ALTER TABLE public.integration_logs ADD COLUMN external_id text;
        CREATE INDEX integration_logs_external_id_idx ON public.integration_logs(external_id);
    END IF;
END $$;
