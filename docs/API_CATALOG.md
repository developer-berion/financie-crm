# Catálogo de API - Edge Functions

Todas las funciones residen en `/supabase/functions` y son invocadas vía HTTP (REST) o Scheduled Cron.

Base URL: `[SUPABASE_PROJECT_URL]/functions/v1`

## 1. Webhooks de Ingesta

### `meta_webhook`
Recibe notificaciones `leadgen` desde Facebook Graph API.
- **Trigger**: Solicitud HTTP POST desde Meta.
- **Auth**: Validación de firma `X-Hub-Signature-256` (Secret: `META_APP_SECRET`).
- **Input**: Payload estándar de Meta Webhooks (Batch de entries).
- **Proceso**:
  - Verifica firma.
  - Itera sobre `changes`.
  - Extrae `leadgen_id`.
  - Consulta Graph API para obtener datos del lead.
  - Inserta/Upsert en `leads`.
  - Crea evento `lead.received.meta`.
- **Output**: 200 OK (simple acknowledgement).

### `calendly_webhook`
Recibe notificaciones de citas creadas/canceladas.
- **Trigger**: Solicitud HTTP POST desde Calendly.
- **Auth**: Validación de firma `Calendly-Webhook-Signature` (HMAC-SHA256).
- **Input**: Payload de evento Calendly (`invitee.created`, `invitee.canceled`).
- **Proceso**:
  - Verifica firma y marca de tiempo.
  - Busca `email` del lead en DB.
  - Crea registro en `appointments`.
  - Actualiza el stage del lead (ej: "Cita Agendada").
- **Output**: 200 OK.

### `elevenlabs_webhook`
Recibe actualizaciones de estado de las llamadas de IA.
- **Trigger**: Webhook configurado en ElevenLabs Agent.
- **Input**: Payload con `call_id`, `analysis` (transcript, sentiment).
- **Proceso**:
  - Guarda transcript en `lead_events`.
  - Detecta si hubo "Success" (Cita agendada) basado en el análisis.
  - Detiene la secuencia de llamadas si es exitoso.

## 2. Orquestación y Llamadas

### `call_dispatcher`
Motor de decisiones para iniciar llamadas.
- **Trigger**: Cron Job (Cada 1-5 minutos).
- **Auth**: `Authorization: Bearer [SERVICE_ROLE]` (Interno).
- **Input**: N/A (Opcional: parameters para forzar check).
- **Proceso**:
  - Consulta `call_schedules` activos y vencidos (`next_attempt_at <= NOW()`).
  - Filtra por Timezone del Lead (Reglas de "No molestar").
  - Verifica si ya contestó (`lead_events`).
  - Si es válido: Invoca `make_outbound_call` o crea Job.
  - Recalcula `next_attempt_at` para reintentos.
- **Output**: JSON Array con resultados por schedule procesado.

### `make_outbound_call`
Ejecutor de la llamada.
- **Trigger**: Invocado por Dispatcher o UI (Llamada Manual).
- **Input**: `{ "lead_id": "uuid" }`.
- **Proceso**:
  - Obtiene datos del lead y contexto (Signup Date, objetivo).
  - Llama a API ElevenLabs (`POST /v1/convai/twilio/outbound-call`).
  - Registra `call_id` en lead.
  - Crea evento `call.outbound_triggered`.
- **Output**: `{ "success": true, "call_id": "..." }` o Error.

## 3. Utilidades

### `process_jobs`
Worker genérico para procesar la cola de `jobs`.
- **Trigger**: Cron o Trigger de DB (`pg_net` invoca function).
- **Proceso**:
  - Lee jobs en estado `PENDING` con `scheduled_at <= NOW()`.
  - Ejecuta la acción correspondiente (ej: reintentar llamada fallida).
  - Actualiza estado a `COMPLETED` o `FAILED`.
