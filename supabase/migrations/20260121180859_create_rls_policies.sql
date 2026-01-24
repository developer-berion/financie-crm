-- Enable RLS
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.tasks enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.appointments enable row level security;
alter table public.integration_logs enable row level security;
alter table public.call_schedules enable row level security;

-- App Settings for Single User
create table public.app_settings (
    key text primary key,
    value text
);

-- Insert placeholder for allowed email. 
insert into public.app_settings (key, value) values ('allowed_email', 'CHANGE_ME');

-- Helper function
create or replace function public.is_allowed_user()
returns boolean as $$
begin
  -- Check if the current user's email matches the allowed_email setting
  return (
    select count(*) > 0
    from public.app_settings
    where key = 'allowed_email'
    and value = (auth.jwt() ->> 'email')
  );
end;
$$ language plpgsql security definer;

-- Policies
create policy "Owner Access Leads" on public.leads for all using (public.is_allowed_user());
create policy "Owner Access Events" on public.lead_events for all using (public.is_allowed_user());
create policy "Owner Access Tasks" on public.tasks for all using (public.is_allowed_user());
create policy "Owner Access Stages" on public.pipeline_stages for all using (public.is_allowed_user());
create policy "Owner Access Appointments" on public.appointments for all using (public.is_allowed_user());
create policy "Owner Access Logs" on public.integration_logs for all using (public.is_allowed_user());
create policy "Owner Access Schedules" on public.call_schedules for all using (public.is_allowed_user());
create policy "Owner Access Settings" on public.app_settings for select using (public.is_allowed_user());
