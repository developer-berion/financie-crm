-- Create table for Agentes (Recruitment)
create table if not exists public.agentes (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null,
    phone_number text not null,
    calendly_events jsonb default '[]'::jsonb, -- Stores array of related Calendly event objects
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.agentes enable row level security;

-- Policies

-- 1. Allow public (anon) and authenticated users to INSERT data (for Landing Page submissions)
create policy "Enable Insert for Public" 
on public.agentes 
for insert 
to anon, authenticated 
with check (true);

-- 2. Allow Admin (Owner) to do everything (View, Edit, Delete)
-- Uses the existing is_allowed_user() helper from 20260121180859_create_rls_policies.sql
create policy "Owner Access Agentes" 
on public.agentes 
for all 
using (public.is_allowed_user());

-- Add comments
comment on table public.agentes is 'Stores agent applications from the landing page, independent of the main CRM leads';
comment on column public.agentes.calendly_events is 'Stores Calendly event data (scheduler details) associated with this agent application';
