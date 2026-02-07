# Diccionario de Datos - Financie CRM

Este documento detalla el esquema de la base de datos PostgreSQL alojada en Supabase.
**Schema**: `public`

## Tablas Principales

### `leads`
Almacena la información de contacto de los prospectos (leads). Es la tabla central del sistema.

| Columna | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | Primary Key. |
| `created_at` | `timestamptz` | NO | Fecha de creación del registro. |
| `full_name` | `text` | YES | Nombre completo del lead. |
| `email` | `text` | YES | Correo electrónico. |
| `phone` | `text` | YES | Teléfono normalizado (E.164 o clean digits). |
| `status` | `text` | NO | Estado actual (`new`, `contacted`, `closed`, etc.). |
| `meta_lead_id` | `text` | YES | ID externo de Meta Lead Ads. |
| `meta_form_id` | `text` | YES | ID del formulario de Meta origen. |
| `state` | `text` | YES | Estado geográfico (US) inferido o provisto. |
| `marketing_consent` | `bool` | YES | Flag de consentimiento para llamadas/SMS. |
| `last_call_id` | `text` | YES | ID de la última llamada de ElevenLabs asociada. |
| `signup_date` | `text` | YES | Fecha de registro en formato local ("YYYY-MM-DD"). |
| `signup_time` | `text` | YES | Hora de registro en formato local ("HH:mm"). |
| `stable_income` | `text` | YES | Campo enriquecido por AI (Ingresos estables). |
| `main_objective` | `text` | YES | Campo enriquecido por AI (Objetivo). |
| `health_condition` | `text` | YES | Campo enriquecido por AI (Salud). |
| `bot_verification` | `text` | YES | Respuesta al reto anti-bot (ej: "2+3?"). |

### `lead_events`
Log de auditoría "Append-Only". Cada acción relevante sobre un lead se guarda aquí.

| Columna | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | PK. |
| `lead_id` | `uuid` | YES | FK -> `leads.id`. |
| `event_type` | `text` | NO | Tipo: `lead.created`, `call.completed`, `note.added`. |
| `payload` | `jsonb` | YES | Datos del evento (transcripciones, response bodies). |
| `created_at` | `timestamptz` | NO | Timestamp del evento. |

### `call_schedules`
Controla la lógica de reintentos automáticos para llamadas.

| Columna | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | PK. |
| `lead_id` | `uuid` | YES | FK -> `leads.id`. |
| `active` | `bool` | NO | Si `true`, el dispatcher considerará este lead. |
| `retry_count_block`| `int4` | NO | Intentos realizados en la ventana horaria actual. |
| `retry_count_total`| `int4` | NO | Intentos totales históricos. |
| `next_attempt_at` | `timestamptz` | YES | Fecha mínima para el próximo intento. |
| `last_attempt_at` | `timestamptz` | YES | Fecha del último intento real. |

### `jobs`
Cola de tareas asíncronas para ejecución diferida o manual.

| Columna | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | PK. |
| `type` | `text` | NO | Tipo: `make_call`, `send_sms`. |
| `status` | `text` | NO | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`. |
| `scheduled_at` | `timestamptz` | NO | Cuándo debe ejecutarse. |
| `payload` | `jsonb` | YES | Argumentos para la función ejecutora. |
| `error` | `text` | YES | Mensaje de error si falló. |

### `appointments`
Citas sincronizadas desde Calendly.

| Columna | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | PK. |
| `lead_id` | `uuid` | YES | FK -> `leads.id` (si match). |
| `start_time` | `timestamptz` | NO | Inicio de la cita. |
| `status` | `text` | YES | `active`, `canceled`. |
| `calendly_event_uri`| `text` | YES | ID único de Calendly. |
| `meeting_url` | `text` | YES | Link a Google Meet / Zoom. |

### `integration_logs`
Logs técnicos de raw requests de webhooks (debugging).

## JSONB Structures Importantes

### `lead_events.payload` (Ejemplo: Call Answered)
```json
{
  "call_id": "conv_xyz123",
  "duration": 120,
  "recording_url": "https://...",
  "status": "completed",
  "analysis": {
    "sentiment": "positive",
    "summary": "Cliente interesado en seguro de vida."
  }
}
```

## Relaciones Clave
- `leads` (1) <-> (N) `lead_events`
- `leads` (1) <-> (N) `jobs`
- `leads` (1) <-> (1) `call_schedules` (Relación lógica, usualmente 1 activo).
