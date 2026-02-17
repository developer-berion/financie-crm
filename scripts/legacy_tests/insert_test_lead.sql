
-- Insert Test Lead and FORCE expedited call (1 minute delay)
-- This script manually inserts both the Lead and the Job to ensure it runs in 1 minute
-- without waiting for the asynchronous Edge Function trigger.

BEGIN;

-- 1. Insert the Lead (Save ID for later)
WITH inserted_lead AS (
    INSERT INTO public.leads (
        full_name,
        phone,
        email,
        source,
        stable_income,
        main_objective,
        health_condition,
        signup_date,
        signup_time,
        state,
        marketing_consent
    ) VALUES (
        'Bianca Garcia',
        '(786) 436-8033',
        'biancagarcia.finances@gmail.com',
        'manual_test_expedited',
        'Si',
        'Protección',
        'no',
        'sabado 26 de enero',
        '11:00 AM',
        'florida',
        true
    ) RETURNING id
)
-- 2. Insert the Job record immediately for 1 minute from now
INSERT INTO public.jobs (
    lead_id,
    type,
    scheduled_at,
    status
) 
SELECT 
    id, 
    'INITIAL_CALL', 
    now() + interval '1 minute', 
    'PENDING'
FROM inserted_lead;

COMMIT;