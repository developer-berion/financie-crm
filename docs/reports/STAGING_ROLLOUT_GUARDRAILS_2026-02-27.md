# Staging Rollout Guardrails - 2026-02-27

## Scope
Safe rollout for Supabase hardening without impacting the current CRM flow.

## 1) Validate Environment Target (staging only)
Run before any migration/apply step:

```bash
npm run verify:staging-target
```

Expected output: `Staging target verified: mgewvaujdsvnmaoulnwr`

## 2) Configure runtime DB settings in staging
These settings are required for trigger/cron HTTP calls.

```sql
alter database postgres set app.settings.supabase_url = 'https://mgewvaujdsvnmaoulnwr.supabase.co';
alter database postgres set app.settings.service_role_key = '<STAGING_SERVICE_ROLE_KEY>';
```

## 3) Apply migration batch in staging
Includes:
- Secret/url cleanup in historical migrations.
- New hardening migration `20260227113000_supabase_safety_hardening.sql`.
- RLS posture for `sms_events`, `call_events`, `conversation_results`, `jobs`.
- Cron alignment (`call_dispatcher` active, `process_jobs` unscheduled while disabled).

## 4) Post-deploy validation (no-regression)
- Insert a test lead and confirm trigger to `orchestrate_lead` still works.
- Validate `call_dispatcher` cron exists and runs.
- Confirm no `process-jobs-every-minute` cron job remains scheduled.
- Validate timeline/events for call and SMS webhooks.
- If `ENABLE_TWILIO_ELEVENLABS=false`, expect ElevenLabs checks/webhook to appear as `SKIPPED` (not failure).
- Run post-rotation validator:

```bash
npm run validate:post-rotation
```

## 5) Security gates
Run locally/CI:

```bash
npm run scan:secrets
```

This fails on:
- `sb_secret_...` literals
- `sk_...` literals
- hardcoded legacy production Supabase URL
