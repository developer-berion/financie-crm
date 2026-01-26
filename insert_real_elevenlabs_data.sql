-- Insert Real ElevenLabs Conversation Data for UI Testing (Fixed for missing constraints)
-- Disables the orchestration trigger temporarily to prevent a real call

BEGIN;

-- 1. Disable the orchestration trigger
ALTER TABLE public.leads DISABLE TRIGGER tr_orchestrate_new_lead;

-- 2. Use a PL/PGSQL block to handle logic without relying on specific UNIQUE constraints
DO $$
DECLARE
    v_lead_id uuid;
    v_transcript text;
    v_summary text;
BEGIN
    -- Define the large text content variables for cleanliness
    v_transcript := 'agent: 

user: Hola.
agent: ...
user: Hola.
agent: Hola, ¿hablo con Bianca Garcia?
user: Sí.
agent: Mi nombre es Laura, soy la asistente virtual de la licenciada Bianca Garcia. Esta llamada puede ser grabada por motivos de calidad. Te contacto porque llenaste un formulario en Facebook o Instagram mostrando interés en nuestras estrategias financieras de protección y crecimiento a largo plazo. ¿Tienes un minuto para hablar?
user: ¿Qué estrategias financieras? No lo recuerdo.
agent: Entiendo, es normal. Mire, el día veintiséis de enero a las once y tres de la mañana en Florida, nos llegó un formulario de Facebook o Instagram con su interés. Aquí aparece: Nombre: Bianca Garcia. ¿Aún le interesa que le agende una llamada con la licenciada Bianca Garcia?
user: Sí, pero ¿de qué se trata?
agent: Totalmente válido. Lo mejor sería que uno de nuestros agentes licenciados pueda responder esa y cualquier otra inquietud que tenga. ¿Le parece si le agendo una llamada? Para agendarle con la persona correcta, solo dos pregunticas rápidas.
user: Es que no entiendo.
agent: Totalmente válido. Lo mejor sería que uno de nuestros agentes licenciados pueda responder esa y cualquier otra inquietud que tenga. ¿Le parece si le agendo una llamada? Para agendarle con la persona correcta, solo...
user: No, no voy a agendar. No voy a agendar ninguna llamada si no me explicas qué fue lo que llené porque he llenado varias cosas en Facebook. Entonces necesito que me expliques qué fue lo que llené.
agent: Entiendo. Puede haber sido usted o alguien con acceso a su teléfono. Si prefiere, detengo las llamadas y listo. ¿Desea que no lo contactemos más?
user: Sí, pero si me estás llamando es por algo, sí llené algo, pero quiero saber sobre qué es
agent: Totalmente válido. Lo mejor sería que uno de nuestros agentes licenciados pueda responder esa y cualquier otra inquietud que tenga. ¿Le parece si le agendo una llamada? Para agendarle con la persona correcta, solo dos pregunticas rápidas.
user: OK, ¿cuáles?
agent: Una de las preguntas es si actualmente estás trabajando o tienes ingresos de forma constante.
user: No estoy trabajando.
agent: Entiendo. ¿Eres dueña de negocio o trabajadora independiente?
user: Sí, trabajo independiente.
agent: Perfecto. En términos generales, ¿padeces de alguna condición de salud importante?
user: No.
agent: Excelente. Ahora, ¿deseas agendar una llamada con un agente licenciado? Puede ser telefónica o vía Zoom. Tenemos disponibilidad entre las diez de la mañana y la una de la tarde, o entre las cuatro de la tarde y las ocho de la noche, hora del este.
user: A las 5 de la tarde
agent: Hhmmmm...Si, me das unos segundos por favor... Perfecto. Entonces agendamos la llamada para hoy a las cinco de la tarde, hora del este. ¿Es correcto?
user: Ok
agent: Perfecto. Entonces agendamos la llamada para hoy a las cinco de la tarde, hora del este. ¡Que tenga un excelente día!
agent: None
agent: None';

    v_summary := 'La agente de IA, Laura, contactó a Bianca Garcia en relación con un formulario que supuestamente llenó expresando interés en estrategias financieras. Bianca no recordaba haber llenado el formulario, pero confirmó su interés. Luego, la agente hizo preguntas de calificación, repitiendo una sobre ingresos estables, lo cual Bianca señaló. La agente se disculpó por el error y procedió a preguntar sobre condiciones de salud. Finalmente, se programó una cita para las 5 p.m. EST de hoy.';

    -- A. Handle Lead
    SELECT id INTO v_lead_id FROM public.leads WHERE phone = '+17864368033' LIMIT 1;

    IF v_lead_id IS NULL THEN
        INSERT INTO public.leads (full_name, phone, email, source, status, state)
        VALUES ('Bianca Garcia', '+17864368033', 'bianca.garcia@example.com', 'facebook_form', 'Calificado', 'florida')
        RETURNING id INTO v_lead_id;
        RAISE NOTICE 'New lead created with ID: %', v_lead_id;
    ELSE
        UPDATE public.leads SET full_name = 'Bianca Garcia', state = 'florida' WHERE id = v_lead_id;
        RAISE NOTICE 'Existing lead updated with ID: %', v_lead_id;
    END IF;

    -- B. Handle Call Event
    -- First delete to ensure clean state
    DELETE FROM public.call_events WHERE call_sid = 'CA67028e652e3bd06b18742a2f025ffe69';
    
    INSERT INTO public.call_events (lead_id, call_sid, status_crm, duration_seconds, created_at)
    VALUES (v_lead_id, 'CA67028e652e3bd06b18742a2f025ffe69', 'EXITOSA', 217, '2026-01-26 12:05:00-04');

    -- C. Handle Conversation Result
    -- First delete to ensure clean state
    DELETE FROM public.conversation_results WHERE conversation_id = 'conv_6401kfxgt9aef9bbjts56es3q3v0';

    INSERT INTO public.conversation_results (
        lead_id, 
        call_sid, 
        conversation_id, 
        transcript, 
        summary, 
        outcome, 
        scheduled_datetime, 
        scheduled_channel, 
        created_at
    )
    VALUES (
        v_lead_id, 
        'CA67028e652e3bd06b18742a2f025ffe69', 
        'conv_6401kfxgt9aef9bbjts56es3q3v0', 
        v_transcript, 
        v_summary, 
        '{"call_outcome": "Cita Agendada"}'::jsonb, 
        '2026-01-26 17:00:00-05', 
        'phone', 
        '2026-01-26 12:05:00-04'
    );

END $$;

-- 3. Re-enable the orchestration trigger
ALTER TABLE public.leads ENABLE TRIGGER tr_orchestrate_new_lead;

COMMIT;
