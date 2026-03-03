# P0 Security Execution - 2026-02-27

## Scope completed

This execution closes the operational blockers for:
- Post-rotation critical-flow validation.
- Local staging key drift (`anon` and `service_role`).
- Known ElevenLabs `500` noise while integration is intentionally inactive.

## Changes applied

1. Post-rotation validator hardened and integrated:
- `scripts/security/validate-post-rotation.js`
- `package.json` (`validate:post-rotation`)
- `docs/SECURITY_POST_ROTATION_VALIDATION.md`

2. Communications disabled mode enforced:
- `supabase/functions/elevenlabs_webhook/index.ts`
  - Returns `202` with `skipped=communications_disabled` when `ENABLE_TWILIO_ELEVENLABS=false`.
- `supabase/functions/system_integrity/index.ts`
  - Reports ElevenLabs/Twilio as `SKIPPED` when communications are disabled.
- Validator updated to treat that state as expected.

3. Environment alignment:
- `.env.local` updated with current staging keys:
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

4. Staging rollout changes executed (`mgewvaujdsvnmaoulnwr`):
- `ENABLE_TWILIO_ELEVENLABS=false` set in Supabase secrets.
- Edge functions deployed:
  - `elevenlabs_webhook`
  - `system_integrity`

## Validation results

Command:

```bash
npm run validate:post-rotation
```

Current status:
- PASS: Target environment guardrail.
- PASS: Secret/governance scan.
- PASS: Supabase REST health.
- PASS: `system_integrity`.
- PASS: `orchestrate_lead`, `call_dispatcher`.
- PASS: `elevenlabs_webhook` in disabled mode.
- PASS: ElevenLabs API skipped as expected.
- WARN: `integration_logs` contains at least one historical auth-like entry in latest 100 rows.

## Step-by-step to reactivate ElevenLabs later

1. Prepare secrets (staging first):
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_WEBHOOK_SECRET`
- `ELEVENLABS_AGENT_ID`
- `ELEVENLABS_PHONE_ID` (or `ELEVENLABS_PHONE_NUMBER_ID`)

2. Enable communications flag:

```bash
supabase secrets set ENABLE_TWILIO_ELEVENLABS=true --project-ref mgewvaujdsvnmaoulnwr
```

3. Deploy runtime functions:

```bash
supabase functions deploy elevenlabs_webhook --project-ref mgewvaujdsvnmaoulnwr
supabase functions deploy make_outbound_call --project-ref mgewvaujdsvnmaoulnwr
supabase functions deploy system_integrity --project-ref mgewvaujdsvnmaoulnwr
```

4. Reconfigure external webhook (ElevenLabs side):
- Point callback to:
  - `https://<project-ref>.supabase.co/functions/v1/elevenlabs_webhook`
- Ensure signature header is enabled and matches `ELEVENLABS_WEBHOOK_SECRET`.

5. Run validation gate:

```bash
npm run validate:post-rotation -- --strict
```

6. Observe first 24h:
- Monitor `integration_logs`, `lead_events`, `conversation_results`.
- Check for auth/signature errors and duplicated call events.

## Recommendations for future implementations

1. Split feature flags:
- Replace shared `ENABLE_TWILIO_ELEVENLABS` with two flags:
  - `ENABLE_TWILIO`
  - `ENABLE_ELEVENLABS`

2. Add deployment gate:
- Block production deploy if `validate:post-rotation -- --strict` fails.

3. Add ClickUp automation:
- Auto-comment task with validator output and move to `complete` only if all critical checks pass.

4. Key governance:
- Quarterly rotation cadence for `anon/service_role` and external integration keys.
- Keep `.env.local` out of long-lived manual edits; prefer pull from secure source.

5. Reactivation checklist as release artifact:
- Keep this runbook versioned per environment (staging/prod) and attach it to the corresponding ClickUp task.
