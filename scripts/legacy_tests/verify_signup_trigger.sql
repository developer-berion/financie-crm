-- Verification Script: Test Automatic Signup Context Trigger

-- 1. Insert a lead from California (expecting PST time)
INSERT INTO public.leads (full_name, phone, state, status)
VALUES ('Test California Trigger', '+15550000001', 'California', 'Nuevo');

-- 2. Insert a lead from Florida (expecting EST time)
INSERT INTO public.leads (full_name, phone, state, status)
VALUES ('Test Florida Trigger', '+15550000002', 'Florida', 'Nuevo');

-- 3. Check the results
SELECT 
    full_name, 
    state, 
    signup_date, 
    signup_time,
    created_at
FROM public.leads 
WHERE phone IN ('+15550000001', '+15550000002');

-- Expected Result:
-- Test California Trigger -> signup_time should match created_at converted to America/Los_Angeles
-- Test Florida Trigger    -> signup_time should match created_at converted to America/New_York
