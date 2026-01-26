-- Insert Test Lead with Transcription for Agenda Detection
BEGIN;

-- 1. Insert the Lead
WITH inserted_lead AS (
    INSERT INTO public.leads (
        full_name,
        phone,
        email,
        source,
        status
    ) VALUES (
        'Carlos Test Agenda',
        '(555) 123-4567',
        'carlos@test.com',
        'agenda_test',
        'Nuevo'
    ) RETURNING id
),
-- 2. Insert successful call event
inserted_call AS (
    INSERT INTO public.call_events (
        lead_id,
        call_sid,
        status_crm,
        duration_seconds
    )
    SELECT id, 'test_sid_' || id, 'EXITOSA', 120
    FROM inserted_lead
    RETURNING call_sid, lead_id
)
-- 3. Insert conversation result with transcript containing date/time
INSERT INTO public.conversation_results (
    lead_id,
    call_sid,
    conversation_id,
    transcript,
    summary,
    outcome
)
SELECT 
    lead_id, 
    call_sid, 
    'conv_' || call_sid,
    'Hola Carlos, quedamos entonces para el lunes 27 de enero a las 11:00 AM para revisar tu plan de retiro.',
    'El cliente está interesado en un plan de retiro y agendó una cita.',
    '{"call_outcome": "Cita Agendada"}'::jsonb
FROM inserted_call;

COMMIT;
