# Pending Tasks

## High Priority
- [ ] **Production Build**: Run `npm run build` and deploy to Hostinger.
- [ ] **Webhook Verification (Live)**: Once deployed/exposed, verifies real Meta and Calendly payloads.
- [ ] **ElevenLabs**: Replace the "Stub" in `call_dispatcher` with real API call (requires API Key).
- [ ] **Cron Job**: Set up a Cron Job (Supabase pg_cron or external) to hit `[FUNCTION_URL]/call_dispatcher` every 5-15 minutes.

## Improvements / Next Phase
- [ ] **Email Notifications**: Notify agent on new lead via email?
- [ ] **User Settings**: UI to change "Allowed Email" or reset password.
- [ ] **Better Error Handling**: UI Toasts/Alerts for Edge Function errors.
- [ ] **Phone Number Formatting**: Enforce strict E.164 formatting for calls.

## Known Issues (WIP)
- **Dashboard**: "Actividad Reciente" is a placeholder text.
- **Tasks**: "General" tasks (without lead_id) might need a specific UI flow.
