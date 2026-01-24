# Setup Checklist

## 1. Supabase Initialization (One-time)
- [ ] **Deploy Migrations**: 
  - If local: `npx supabase db reset` (applies all migrations).
  - If production: Copy SQL from `supabase/migrations/` to Supabase SQL Editor OR link project and run `supabase db push`.
- [ ] **Create User**: In Supabase Auth Dashboard, create the single user (email + password).
- [ ] **Configure Permissions**:
  - Update `app_settings` with the user's email so RLS allows access:
    ```sql
    update public.app_settings set value = 'target_user@email.com' where key = 'allowed_email';
    ```
- [ ] **Disable Signups**: In Supabase Auth Settings, turn OFF "Allow new users to sign up".

## 2. Environment Variables
### Local (.env.local)
- [x] `VITE_SUPABASE_URL`
- [x] `VITE_SUPABASE_ANON_KEY`

### Production (Supabase Edge Functions Secrets)
- [ ] Run `npx supabase secrets set META_APP_SECRET=...`
- [ ] `META_VERIFY_TOKEN`
- [ ] `META_ACCESS_TOKEN`
- [ ] `CALENDLY_SIGNING_KEY` (if available)

## 3. Webhooks Configuration
- [ ] **Meta**: Set Callback URL to `[FUNCTION_URL]/meta_webhook`. Verify Token = `META_VERIFY_TOKEN`.
- [ ] **Calendly**: Set Webhook URL to `[FUNCTION_URL]/calendly_webhook`.

## 4. Scheduling
- [ ] **Cron**: Configure `pg_cron` or external scheduler to hit `[FUNCTION_URL]/call_dispatcher`.
