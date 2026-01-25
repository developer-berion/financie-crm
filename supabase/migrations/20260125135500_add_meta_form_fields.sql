-- Migration: 20260125135500_add_meta_form_fields.sql
-- Description: Add fields for Meta Lead Form qualification questions

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS main_objective text,
ADD COLUMN IF NOT EXISTS stable_income text,
ADD COLUMN IF NOT EXISTS health_condition text;

-- Add comments for clarity (optional but good practice)
COMMENT ON COLUMN public.leads.main_objective IS 'Objetivo Principal (Protección Familiar, Ahorro para retiro, etc.)';
COMMENT ON COLUMN public.leads.stable_income IS 'Tiene trabajo o ingresos estables? (Si/No)';
COMMENT ON COLUMN public.leads.health_condition IS 'Tiene alguna condición de salud? (Si/No)';
