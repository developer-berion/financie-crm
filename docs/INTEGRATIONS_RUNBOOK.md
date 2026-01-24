# INTEGRATIONS_RUNBOOK

Este documento detalla la configuración operativa de las integraciones externas. 
**NOTA**: Nunca commitear secrets reales aquí. Usar referencias a Variables de Entorno.

## Meta Lead Ads (Webhooks)
- **Setup**:
  - App Dashboard > Webhooks > Leadgen.
  - Callback URL: `[SUPABASE_FUNCTION_URL]/meta_webhook`
  - Verify Token: Definido en `META_VERIFY_TOKEN` (Supabase Secrets).
- **Validación**:
  - Firmado con `X-Hub-Signature-256`.
  - Clave en `META_APP_SECRET`.
- **Pruebas**:
  - Usar [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing).
  - Payload incluye `leadgen_id`. El backend consulta Graph API para detalles.
- **Troubleshooting**:
  - Revisar `integration_logs` en DB.
  - Error común: Token expirado o permisos faltantes (`leads_retrieval`).

## Calendly (Webhooks)
- **Setup**:
  - Crear suscripción a webhook via API o Integrations panel.
  - Eventos: `invitee.created`, `invitee.canceled`.
  - URL: `[SUPABASE_FUNCTION_URL]/calendly_webhook`
- **Validación**:
  - Header `Calendly-Webhook-Signature` (HMAC-SHA256).
  - Signing Key en `CALENDLY_SIGNING_KEY`.
- **Datos Clave**:
  - `uri`: ID único de la cita.
  - `email` y `text_notification_phone_number` para mapear al Lead.
- **Troubleshooting**:
  - Si no llega el webhook, verificar estado de suscripción en Calendly API.

## ElevenLabs (Stub / Futuro)
- **Estado Actual**: STUB (Simulación).
- **Funcionalidad**: Registra intentos de llamada pero no ejecuta audio real.
- **Logs**: Aparecen en `integration_logs` con provider `elevenlabs-stub` y status `ignored`.

## Variables de Entorno (Supabase Console > Edge Functions > Secrets)
```
META_APP_SECRET=...
META_VERIFY_TOKEN=...
META_ACCESS_TOKEN=...
CALENDLY_SIGNING_KEY=...
```
