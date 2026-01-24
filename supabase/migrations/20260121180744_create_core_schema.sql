-- Pipeline Stages
create table public.pipeline_stages (
    id uuid not null default gen_random_uuid() primary key,
    name text not null,
    sort_order int not null unique,
    created_at timestamptz not null default now()
);

-- Leads
create table public.leads (
    id uuid not null default gen_random_uuid() primary key,
    full_name text not null,
    phone text not null,
    email text,
    source text not null default 'meta',
    meta_lead_id text,
    meta_form_id text,
    meta_campaign_id text,
    meta_adset_id text,
    meta_ad_id text,
    status text not null default 'Nuevo',
    stage_id uuid references public.pipeline_stages(id),
    do_not_call boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Lead Events
create table public.lead_events (
    id uuid not null default gen_random_uuid() primary key,
    lead_id uuid not null references public.leads(id) on delete cascade,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- Indexes
create index leads_phone_idx on public.leads(phone);
create index leads_email_idx on public.leads(email);
create index lead_events_lead_id_idx on public.lead_events(lead_id);
