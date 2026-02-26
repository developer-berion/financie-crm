-- Migration to relax phone constraint and add central normalization
-- Date: 2026-02-24

-- 1. Drop the strict phone format constraint to allow "campo abierto"
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS check_phone_format;

-- 2. Create normalization function
CREATE OR REPLACE FUNCTION fn_normalize_phone()
RETURNS TRIGGER AS $$
DECLARE
    cleaned_phone TEXT;
BEGIN
    -- If phone is NULL or empty, do nothing
    IF NEW.phone IS NULL OR NEW.phone = '' THEN
        RETURN NEW;
    END IF;

    -- Remove non-numeric characters EXCEPT the '+' sign if it exists at the start
    -- This keeps +1234... but cleans 1-234... and (1) 234...
    cleaned_phone := regexp_replace(NEW.phone, '[^0-9+]', '', 'g');
    
    -- If it doesn't start with +, and it's 10 digits, assume it's US/Canada and add +1
    IF cleaned_phone !~ '^\+' THEN
        IF length(cleaned_phone) = 10 THEN
            cleaned_phone := '+1' || cleaned_phone;
        ELSIF length(cleaned_phone) > 10 AND NOT cleaned_phone LIKE '+%' THEN
            -- If it's already longer than 10 but missing +, just append +
            cleaned_phone := '+' || cleaned_phone;
        END IF;
    END IF;

    NEW.phone := cleaned_phone;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to normalize phone BEFORE insert or update
DROP TRIGGER IF EXISTS tr_normalize_phone ON public.leads;
CREATE TRIGGER tr_normalize_phone
BEFORE INSERT OR UPDATE OF phone ON public.leads
FOR EACH ROW
EXECUTE FUNCTION fn_normalize_phone();

-- 4. (Optional) Run normalization on existing leads that might be "dirty"
-- UPDATE public.leads SET phone = phone WHERE phone IS NOT NULL;
