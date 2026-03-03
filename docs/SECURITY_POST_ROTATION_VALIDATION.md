# Security Post-Rotation Validation

This runbook validates the P0 task "Validacion post-rotacion de flujos criticos" after rotating keys.

## Command

```bash
npm run validate:post-rotation
```

Optional strict mode (fails on warnings):

```bash
npm run validate:post-rotation -- --strict
```

## What it checks

1. Environment guardrail:
- Verifies `.env.local` Supabase project ref matches `supabase/.temp/project-ref` (if present).
2. Secret hygiene:
- Runs `scripts/security/check-secrets.js`.
3. Core platform health:
- Validates Supabase REST access (`leads` read).
- Calls `system_integrity` edge function.
4. Critical flow health from `system_integrity`:
- `Supabase Database`
- `Edge orchestrate_lead`
- `Edge call_dispatcher`
- `Edge elevenlabs_webhook`
- `ElevenLabs API` (required only when communications are enabled and `ELEVENLABS_API_KEY` is present).
5. Post-rotation auth drift:
- Reviews recent `integration_logs` entries for auth-like failures when `SUPABASE_SERVICE_ROLE_KEY` is available.

## Exit behavior

- Exit `0`: all critical checks passed.
- Exit `1`: any critical check failed.
- With `--strict`, warnings also fail the run.

## Communications disabled mode

If `ENABLE_TWILIO_ELEVENLABS=false`, ElevenLabs checks are expected as `SKIPPED` and do not fail the validation.
