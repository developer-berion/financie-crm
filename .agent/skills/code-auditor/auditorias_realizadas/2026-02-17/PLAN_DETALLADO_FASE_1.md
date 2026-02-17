# Tareas Detalladas Fase 1: Security & Compliance

> **Branch:** `fix/audit-phase-1-security`

## A. Gestión de Secretos (High Risk)
1.  [ ] **CRM-001**: Modificar `supabase/functions/elevenlabs_webhook/index.ts`.
    -   Eliminar `|| 'wsec_...'`.
    -   Agregar `if (!secret) throw...`.
2.  **CRM-008 & CRM-007**: Modificar `supabase/functions/shared-utils.ts` y `make_outbound_call`.
    -   Reemplazar `const agentId = '...'` por `Deno.env.get('ELEVENLABS_AGENT_ID')`.
    -   Reemplazar `const recipients = [...]` por llamada a `app_settings` (o variable temporal).

## B. Verificación de Integridad (Anti-Fraud)
3.  [ ] **CRM-002**: Modificar `supabase/functions/sms_webhook/index.ts`.
    -   Descomentar bloque `if (signature...`.
4.  [ ] **CRM-002**: Modificar `supabase/functions/call_webhook/index.ts`.
    -   Implementar validación de firma similar a `sms_webhook`.

## C. Privacidad y Logs (Compliance)
5.  [ ] **CRM-003**: Modificar `shared-utils.ts`.
    -   Implementar función `safeLog(message, data)`.
    -   Esta función debe enmascarar `email`, `phone`, `name` en el objeto `data` antes de hacer `console.log`.
6.  [ ] **Refactor**: Buscar y reemplazar todos los `console.log` sensibles en Edge Functions.

## D. Control de Acceso (Hardening)
7.  [ ] **CRM-005**: Modificar `corsHeaders` en `shared-utils.ts`.
    -   Cambiar `'*'` por `https://crm.financiegroup.com`.
8.  [ ] **CRM-004**: Crear script SQL `remediate_agentes_rls.sql`.
    -   `DROP POLICY` para las policies inseguras.
    -   `CREATE POLICY` restrictiva.

## E. Configuración
9.  [ ] Generar lista de nuevas variables de entorno requeridas para el dashboard de Supabase:
    -   `ELEVENLABS_WEBHOOK_SECRET` (Confirmar existencia)
    -   `ELEVENLABS_AGENT_ID`
    -   `TWILIO_APP_TOKEN` (si no existe)
