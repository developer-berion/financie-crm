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

## ElevenLabs (Activo)
- **Estado Actual**: ACTIVO (Producción).
- **Funcionalidad**: Llamadas salientes con IA conversacional (Agente Laura).
- **Configuración**:
  - **Agent ID**: `agent_4101kf6gqfgpfrganck3s1m0ap3v`.
  - **Phone Number**: +17863212663.
  - **Tooling**: `voicemail_detection` habilitado + Prompt Rules para colgar en buzón.
- **Troubleshooting**:
  - Si la llamada no sale: Verificar logs de Supabase y créditos en ElevenLabs.
  - Si no cuelga en buzón: Revisar logs d el conversación y ajustar Prompt (palabras clave de saludo).

## Variables de Entorno (Supabase Console > Edge Functions > Secrets)
```
META_APP_SECRET=...
META_VERIFY_TOKEN=...
META_ACCESS_TOKEN=...
CALENDLY_SIGNING_KEY=...
```
