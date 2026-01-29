-- AI SCHEMA REFERENCE
-- Snapshot of Public Schema for Context

CREATE TABLE public.leads (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    full_name text,
    email text,
    phone text,
    status text NOT NULL DEFAULT 'new',
    meta_lead_id text,
    meta_form_id text,
    state text,
    marketing_consent boolean DEFAULT true,
    last_call_id text,
    signup_date text, -- YYYY-MM-DD
    signup_time text, -- HH:mm
    stable_income text,
    main_objective text,
    health_condition text,
    meta_created_at timestamptz
);

CREATE TABLE public.lead_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id),
    event_type text NOT NULL, -- e.g., 'call.completed', 'lead.created'
    payload jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.call_schedules (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id),
    active boolean NOT NULL DEFAULT true,
    retry_count_block integer NOT NULL DEFAULT 0,
    retry_count_total integer NOT NULL DEFAULT 0,
    next_attempt_at timestamptz,
    last_attempt_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL, -- 'make_call', 'send_sms'
    status text NOT NULL DEFAULT 'PENDING',
    scheduled_at timestamptz NOT NULL,
    payload jsonb,
    error text,
    lead_id uuid REFERENCES public.leads(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

CREATE TABLE public.appointments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id),
    provider text NOT NULL DEFAULT 'calendly',
    calendly_event_uri text,
    start_time timestamptz NOT NULL,
    status text,
    meeting_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.integration_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    integration text NOT NULL, -- 'meta', 'calendly'
    payload jsonb,
    headers jsonb,
    status text, 
    error text,
    external_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Note: RLS Policies are applied but not shown here for brevity.
-- All tables generally require auth.role() = 'authenticated' or service_role.
