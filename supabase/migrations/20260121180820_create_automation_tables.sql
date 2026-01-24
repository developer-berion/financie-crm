-- Integration Logs
create table public.integration_logs (
    id uuid not null default gen_random_uuid() primary key,
    provider text not null, -- 'meta', 'calendly', 'elevenlabs'
    request_id text,
    status text not null, -- 'success', 'failure', 'ignored'
    message_safe text,
    payload_ref jsonb default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- Call Schedules
create table public.call_schedules (
    id uuid not null default gen_random_uuid() primary key,
    lead_id uuid not null references public.leads(id) on delete cascade,
    next_attempt_at timestamptz,
    attempts_today int default 0,
    last_attempt_at timestamptz,
    last_outcome text,
    active boolean default true,
    created_at timestamptz not null default now()
);

create index call_schedules_next_attempt_idx on public.call_schedules(next_attempt_at) where active is true;
