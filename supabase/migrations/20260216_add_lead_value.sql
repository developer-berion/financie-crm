alter table public.leads 
add column if not exists estimated_value numeric default 0,
add column if not exists currency text default 'USD';
