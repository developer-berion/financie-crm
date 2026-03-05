# API Catalog - Edge Functions

All functions live in `/supabase/functions` and are invoked via HTTP or cron.

Base URL: `[SUPABASE_PROJECT_URL]/functions/v1`

Current runtime conventions:
- Critical responses include `correlation_id`.
- Structured logs use `logStructured(level, function, event, details)`.

## 1. Inbound Webhooks

### `meta_webhook`
Receives `leadgen` events from Meta/Facebook and upserts lead data.

### `calendly_webhook`
Receives Calendly invitee events and syncs appointments with leads.

### `elevenlabs_webhook`
Receives AI call events from ElevenLabs.
- Auth: `elevenlabs-signature` validated with `ELEVENLABS_WEBHOOK_SECRET`.
- Persists integration logs and conversation outcomes.
- Cancels future call attempts when appointment is confirmed.
- If `ENABLE_TWILIO_ELEVENLABS=false`, returns `202` with `skipped=communications_disabled`.

## 2. Orchestration and Calling

### `call_dispatcher`
Main active orchestration path for outbound calls.
- Trigger: cron (recommended every 5 min).
- Reads `call_schedules` due records.
- Applies DNC, answered-call stop condition, and timezone windows.
- Triggers `make_outbound_call` when the lead is eligible.
- Reschedules next attempts when outside valid windows.

### `make_outbound_call`
Outbound call executor.
- Input: `{ "lead_id": "uuid" }`
- Loads lead context (signup date/time/state).
- Calls ElevenLabs outbound-call endpoint.
- Writes `lead_events`, `integration_logs`, and `last_call_id`.
- Returns `success`, `call_id`, and `correlation_id`.

## 3. Queue Worker

### `process_jobs`
Generic `jobs` queue worker.
- Current operational mode: intentionally disabled.
- Returns a disabled status response with `correlation_id`.
- Active orchestration for calls is `call_dispatcher` while this worker remains disabled.
