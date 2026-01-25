-- Migration: 20260124150000_create_orchestration_tables.sql
-- Description: Create tables for orchestration and tracking

-- Enums for CRM statuses
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sms_status_crm') THEN
        CREATE TYPE sms_status_crm AS ENUM ('RECIBIDO', 'NO_ENVIADO', 'NO_RECIBIDO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status_crm') THEN
        CREATE TYPE call_status_crm AS ENUM ('EXITOSA', 'SIN_RESPUESTA', 'RECHAZADA');
    END IF;
END $$;

-- Table: sms_events
CREATE TABLE IF NOT EXISTS public.sms_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    message_sid text UNIQUE,
    status_raw text,
    status_crm sms_status_crm,
    sent_at timestamptz DEFAULT now(),
    delivered_at timestamptz,
    failed_at timestamptz,
    last_callback_payload jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sms_events_lead_id_idx ON public.sms_events(lead_id);
CREATE INDEX IF NOT EXISTS sms_events_message_sid_idx ON public.sms_events(message_sid);

-- Table: call_events
CREATE TABLE IF NOT EXISTS public.call_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    call_sid text UNIQUE,
    status_raw text,
    status_crm call_status_crm,
    answered_at timestamptz,
    ended_at timestamptz,
    duration_seconds integer,
    last_callback_payload jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_events_lead_id_idx ON public.call_events(lead_id);
CREATE INDEX IF NOT EXISTS call_events_call_sid_idx ON public.call_events(call_sid);

-- Table: conversation_results
CREATE TABLE IF NOT EXISTS public.conversation_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    call_sid text REFERENCES public.call_events(call_sid) ON DELETE SET NULL,
    conversation_id text UNIQUE,
    transcript text,
    summary text,
    outcome jsonb,
    scheduled_datetime timestamptz,
    scheduled_channel text,
    do_not_call boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_results_lead_id_idx ON public.conversation_results(lead_id);
CREATE INDEX IF NOT EXISTS conversation_results_conversation_id_idx ON public.conversation_results(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_results_call_sid_idx ON public.conversation_results(call_sid);

-- Table: jobs (for delayed calling)
CREATE TABLE IF NOT EXISTS public.jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
    type text NOT NULL, -- e.g., 'INITIAL_CALL'
    scheduled_at timestamptz NOT NULL,
    status text DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_scheduled_at_status_idx ON public.jobs(scheduled_at, status);

-- Update leads table to include new status tracking (overlapping with previous migration but ensuring consistency)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS do_not_call boolean DEFAULT false;

-- Trigger to update updated_at on jobs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
