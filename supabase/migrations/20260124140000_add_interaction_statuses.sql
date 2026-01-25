-- Add interaction tracking columns to leads table

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS message_status text check (message_status in ('recibido', 'no_recibido', 'no_enviado', 'enviado')),
ADD COLUMN IF NOT EXISTS call_status text check (call_status in ('exitosa', 'rechazada', 'sin_respuesta')),
ADD COLUMN IF NOT EXISTS last_message_sid text,
ADD COLUMN IF NOT EXISTS last_call_id text;

-- Add indexes for faster lookups by external IDs
CREATE INDEX IF NOT EXISTS leads_last_message_sid_idx ON public.leads(last_message_sid);
CREATE INDEX IF NOT EXISTS leads_last_call_id_idx ON public.leads(last_call_id);
