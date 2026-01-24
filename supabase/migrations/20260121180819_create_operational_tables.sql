-- Tasks
create table public.tasks (
    id uuid not null default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete set null,
    type text not null,
    title text not null,
    due_at timestamptz,
    priority text check (priority in ('low', 'med', 'high')),
    status text check (status in ('pending', 'completed')) default 'pending',
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

-- Appointments
create table public.appointments (
    id uuid not null default gen_random_uuid() primary key,
    lead_id uuid references public.leads(id) on delete cascade,
    provider text not null default 'calendly',
    calendly_event_uri text unique,
    start_time timestamptz not null,
    timezone text,
    meeting_url text,
    status text check (status in ('scheduled', 'canceled', 'rescheduled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
