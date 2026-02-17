# INVENTORY.md — Financie CRM

> **Fecha:** 2026-02-17 · **Modo:** scan_profundo · **Auditor:** CRM Code Auditor Engineer (Enterprise)

---

## 1. Repositorios

| Repo | Stack | Hosting |
|---|---|---|
| `developer-berion/financie-crm` (monorepo) | React 19 + TypeScript 5.9 + Vite 7 + Tailwind 3 (frontend) · Supabase Edge Functions (Deno) (backend) | Supabase (us-east-2) |

---

## 2. Entidades CRM (15 tablas)

| Tabla | Tipo | Campos Clave | RLS |
|---|---|---|---|
| `leads` | Core Aggregate | id, full_name, phone, email, state, source, status, stage_id, call_status, message_status, last_call_id, marketing_consent, terms_accepted, do_not_call, main_objective, stable_income, health_condition, meta_lead_id, meta_created_at, signup_date, signup_time | ✅ |
| `lead_events` | Event Log (append-only timeline) | id, lead_id (FK), event_type, payload (jsonb), created_at | ✅ |
| `pipeline_stages` | Reference Data | id, name, sort_order | ✅ |
| `notes` | User Content | id, lead_id, content, pinned, created_at, updated_at, created_by | ✅ |
| `note_versions` | Audit Trail | id, note_id, content, edited_by, edited_at | ✅ |
| `tasks` | Workflow | id, lead_id, type, title, due_at, priority, status, completed_at | ✅ |
| `appointments` | Calendly Sync | id, lead_id, calendly_event_uri, event_name, start_time, end_time, status, location, join_url, calendly_invitee_uri | ✅ |
| `agentes` | HR/Agents | id, full_name, email, phone_number, calendly_events (jsonb), video_started_at, video_max_watched_seconds, video_duration_seconds | ✅ |
| `call_events` | Telephony Log | id, lead_id, call_sid, status_raw, status_crm, duration_seconds, answered_at, ended_at, last_callback_payload | ✅ |
| `call_schedules` | Job Scheduler | id, lead_id, next_attempt_at, attempts_today, retry_count_block, active, last_attempt_at | ✅ |
| `sms_events` | SMS Log | id, lead_id, message_sid, status_raw, status_crm, delivered_at, failed_at, last_callback_payload | ✅ |
| `jobs` | Background Jobs | id, lead_id, type, status, scheduled_at, retry_count, error | ✅ |
| `conversation_results` | AI Call Results | id, lead_id, call_sid, conversation_id, transcript, summary, outcome (jsonb), scheduled_datetime, scheduled_channel, do_not_call | ✅ |
| `integration_logs` | Integration Audit | id, provider, external_id, status, payload_ref (jsonb), message_safe, created_at | ✅ |
| `app_settings` | Config KV | key (PK), value | ✅ |

---

## 3. Edge Functions (13 deployables)

| Función | Trigger | Integraciones | Firma Verificada |
|---|---|---|---|
| `meta_webhook` | POST (Meta Webhooks) | Meta Graph API, Supabase | ✅ `verifyMetaSignature` |
| `orchestrate_lead` | DB Trigger (INSERT on leads) | Brevo SMTP, Brevo Contacts, Internal | N/A (internal) |
... (ver inventario completo) ...
