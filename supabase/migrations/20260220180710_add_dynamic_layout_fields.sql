-- Migration to add fields for Smart Leads Dynamic Layouts

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS expected_close_date date,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
ADD COLUMN IF NOT EXISTS billing_info jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS contract_details jsonb DEFAULT '{}'::jsonb;
