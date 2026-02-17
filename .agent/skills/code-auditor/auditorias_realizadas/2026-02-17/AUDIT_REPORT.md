# Informe de Auditoría Técnica — Financie CRM

> **Versión:** 1.0.0 · **Fecha:** 2026-02-17
> **Auditor:** CRM Code Auditor Engineer (Enterprise)
> **Modo:** scan_profundo · **Duración:** ~4h
> **Clasificación:** CONFIDENCIAL

---

## 1. Alcance

- **Repo:** `developer-berion/financie-crm` (monorepo: React 19 + Supabase Edge Functions)
- **Entornos:** Producción (Supabase us-east-2)
- **Integraciones:** Meta, ElevenLabs, Twilio, Brevo, Calendly, Supabase
- **Exclusiones:** Ninguna (scan completo 12 dominios)
- **Supuestos:** Single-tenant (1 usuario/organización), no hay LLM generativo propio (ElevenLabs es TTS/AI conversacional, no chat LLM → Dominio 9 evaluado como parcial)
- **Limitaciones:** Sin acceso a logs de producción en tiempo real, sin acceso a métricas de infra (Supabase Dashboard), sin branch protection config visible

## 2. Metodología

- Base: KB_00 (Runbook end-to-end) + 12 dominios KB
- Estándares: NIST SSDF, OWASP ASVS, OWASP API Security Top 10, Google SRE
- Severidad: 4 niveles (Critical / High / Medium / Low)
- Evidencia: Sanitizada, trazable, reproducible (snippets de código, query results, configs)

## 3. Resumen Ejecutivo

- **Postura general:** ⚠️ **Riesgo Alto** — El CRM tiene una base funcional sólida con buenos patrones de event-sourcing y separación de concerns, pero presenta vulnerabilidades críticas en gestión de secretos, verificación de webhooks, y ausencia total de pipeline CI/CD y tests automatizados.
- **Distribución:** **3**C · **5**H · **7**M · **3**L
- **Top 5 riesgos:**
  1. 🔴 Secreto webhook hardcodeado en código fuente (CRM-001)
  2. 🔴 Webhooks Twilio sin verificación de firma (CRM-002)
  3. 🔴 PII (emails, teléfonos) en logs de producción sin masking (CRM-003)
  4. 🟠 RLS policies permiten INSERT/UPDATE con `true` desde rol `anon` (CRM-004)
  5. 🟠 CORS `Access-Control-Allow-Origin: *` en todas las Edge Functions (CRM-005)
- **Dependencias críticas:** Supabase (DB + Auth + Functions), ElevenLabs (AI calls), Brevo (Email + CRM)
- **Cobertura:** 100% de dominios (12/12) · 0 `needs_clarification` bloqueantes

---

## 4. Tabla de Hallazgos (Resumen)

| ID | D# | Hallazgo | Sev. | Quick Win | Fase |
|---|---|---|---|---|---|
| CRM-001 | 5,10 | Webhook secret hardcodeado en código fuente | 🔴 Critical | Mover a env vars | 0–30d |
| CRM-002 | 4 | Twilio webhooks sin verificación de firma | 🔴 Critical | Descomentar verificación | 0–30d |
| CRM-003 | 11 | PII (emails, teléfonos, payloads) en logs sin masking | 🔴 Critical | Eliminar `console.log` de payloads | 0–30d |
| CRM-004 | 5 | RLS policies sobre `agentes` permiten `anon` INSERT/UPDATE con `true` | 🟠 High | Eliminar policies redundantes | 0–30d |
| CRM-005 | 5 | CORS `Allow-Origin: *` en todas las Edge Functions | 🟠 High | Restringir a dominio CRM | 0–30d |
| CRM-006 | 4 | Sin idempotency keys en procesamiento de webhooks | 🟠 High | Dedup por external_id antes de INSERT | 0–30d |
| CRM-007 | 5 | Hardcoded PII: emails de recipients en `shared-utils.ts` | 🟠 High | Mover a `app_settings` | 0–30d |
| CRM-010 | 6 | Sin tests automatizados (0% cobertura) | 🟡 Medium | Tests para flujos críticos | 31–60d |
| CRM-011 | 7 | Sin `trace_id` ni logging estructurado | 🟡 Medium | Agregar correlation ID | 31–60d |
| CRM-013 | 2 | Dependencias duplicadas: 2 SDKs de ElevenLabs | 🟡 Medium | Eliminar sdk redundante | 31–60d |
| CRM-014 | 8 | Dashboard N+1: 7 queries paralelas sin caching | 🟡 Medium | Consolidar en vista/RPC | 31–60d |
| CRM-015 | 1 | `signIn` en AuthContext es no-op (dead code) | 🟡 Medium | Implementar o eliminar | 31–60d |
| CRM-016 | 3 | Falta índice en `lead_events(lead_id, created_at)` para timeline | 🟢 Low | CREATE INDEX CONCURRENTLY | 61–90d |
| CRM-017 | 12 | Sin monitoreo de costos por feature/integración | 🟢 Low | Dashboard de integration_logs | 61–90d |
| CRM-018 | 11 | Sin política de retención de datos (lead_events, integration_logs) | 🟢 Low | Definir TTL + job de limpieza | 61–90d |

---

## 5. Detalle por Hallazgo

### CRM-001 — Webhook Secret Hardcodeado en Código Fuente

- **Dominio:** 5 (Seguridad) + 10 (SDLC)
- **Severidad:** 🔴 Critical
- **Status:** confirmed
- **Descripción:** El secreto de webhook de ElevenLabs está hardcodeado como fallback en el código fuente, expuesto en el repositorio Git.
- **Impacto:** Cualquier persona con acceso al repo puede falsificar webhooks de ElevenLabs, inyectando datos arbitrarios en `conversation_results`, `leads`, y `lead_events`.
- **Causa raíz:** Valor fallback en `||` operator para simplificar desarrollo.
- **Evidencia:**
  ```typescript
  // elevenlabs_webhook/index.ts, línea 4
  const ELEVENLABS_WEBHOOK_SECRET = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET') || 'wsec_[REDACTED]';
  ```
- **Recomendación Quick Win:** Eliminar el fallback hardcodeado. Usar solo `Deno.env.get()` y fallar si no existe. Rotar el secreto actual inmediatamente.
  - Esfuerzo: 1-3 días · Riesgo regresión: Low
  - Validación: Grep en repo por `wsec_` retorna 0 resultados. Webhook sigue funcionando con env var.
- **Recomendación Structural:** Implementar secret scanning en CI (GitHub push protection) para prevenir futuros commits con secrets.
  - Esfuerzo: 2-4 semanas · Deps: CI/CD pipeline
  - Validación: Push con secret bloqueado automáticamente.
- **Referencia KB:** KB_05 §secrets + KB_11 §3 (Secret scanning)
- **Owner sugerido:** Lead Developer
- **Validación/Done:** `git log -S "wsec_"` retorna solo el commit de fix.

---

### CRM-002 — Twilio Webhooks Sin Verificación de Firma

- **Dominio:** 4 (Integraciones/Webhooks)
- **Severidad:** 🔴 Critical
- **Descripción:** Los webhooks de Twilio (`call_webhook` y `sms_webhook`) no verifican la firma X-Twilio-Signature. En `sms_webhook` el código está explícitamente comentado.
- **Impacto:** Cualquier actor puede enviar callbacks falsos a estos endpoints, modificando estados de leads, call_events, sms_events, y triggerando lógica de reintento/scheduling.
- **Causa raíz:** Código de verificación comentado durante debug, nunca re-habilitado.
- **Evidencia:**
  ```typescript
  // sms_webhook/index.ts, líneas 17-23
  // For now, we logging but proceed. In production, return 401 if invalid.
  /*
  if (signature && !(await verifyTwilioSignature(url, body, signature, authToken))) {
      console.warn('Invalid Twilio Signature');
      // return new Response('Forbidden', { status: 403 });
  }
  */
  ```
  ```typescript
  // call_webhook/index.ts — No hay NINGUNA referencia a verificación de firma
  // (verifyTwilioSignature está importada pero nunca usada)
  ```
- **Recomendación Quick Win:** Descomentar y activar la verificación en `sms_webhook`. Agregar verificación en `call_webhook`. Return 401/403 si falla.
  - Esfuerzo: 1-3 días · Riesgo: Low
  - Validación: Test manual con curl sin firma → 401. Twilio callback real → 200.
- **Recomendación Structural:** Centralizar verificación en middleware de `shared-utils.ts` que se aplique automáticamente a todos los webhook handlers.
  - Esfuerzo: 2-4 semanas · Deps: Ninguna
- **Referencia KB:** KB_04 §principios (verify→enqueue→ACK)
- **Owner sugerido:** Lead Developer

---

### CRM-003 — PII en Logs de Producción Sin Masking

- **Dominio:** 11 (Data Governance)
- **Severidad:** 🔴 Critical
- **Descripción:** Múltiples edge functions registran PII (teléfonos, emails, nombres, payloads completos de webhooks) en console.log, que se almacenan en Supabase Edge Function logs.
- **Impacto:** PII de clientes accesible en logs. Violación de best practices GDPR/CCPA. Riesgo de exposición en caso de acceso no autorizado al dashboard.
- **Causa raíz:** Uso de `console.log` para debugging sin sanitización.
- **Evidencia:** (47 ocurrencias de `console.log` en edge functions)
  ```typescript
  // shared-utils.ts:264
  console.log(`Sending SMS to ${to}. StatusCallback: ${statusCallback}`);
  // shared-utils.ts:417
  console.log(`Syncing contact ${lead.email} to Brevo CRM...`);
  // make_outbound_call:63
  console.log(`[MakeOutboundCall] LeadID: ${lead.id}, DB Phone: ${rawPhone}, Cleaned: ${phone}`);
  // sms_webhook:37
  console.log('SMS Webhook received:', body); // body contiene From, To, MessageBody
  // sms_webhook:67
  console.log(`[Blacklist] Blocking SMS from ${From}`);
  ```
- **Recomendación Quick Win:** Reemplazar todos los `console.log` que contengan PII con versiones sanitizadas (solo IDs, últimos 4 dígitos de teléfono). Mover recipients a `app_settings`.
  - Esfuerzo: 1-3 días · Riesgo: Low
- **Recomendación Structural:** Implementar logger estructurado con campo masks automáticos para `phone`, `email`, `body`, `payload`.
  - Esfuerzo: 2-4 semanas
- **Referencia KB:** KB_12 §3 (Masking/Redacción)
- **Owner sugerido:** Lead Developer

---

### CRM-004 — RLS Policies `anon` con `true` en `agentes`

- **Dominio:** 5 (Seguridad/RBAC)
- **Severidad:** 🔴 High
- **Descripción:** La tabla `agentes` tiene policies que permiten INSERT, SELECT, UPDATE para roles `anon` y `authenticated` con condición `true` (sin restricción).
- **Impacto:** Cualquier usuario no autenticado (usando solo el anon key) puede leer, insertar y modificar registros de agentes.
- **Evidencia:**
  ```sql
  -- Policies en agentes:
  -- "Enable Insert for Public"   INSERT  anon,authenticated  with_check: true
  -- ...
  ```
- **Recomendación Quick Win:** Eliminar las 4 policies permisivas y dejar solo "Owner Access Agentes" con `is_allowed_user()`.
  - Esfuerzo: 1-3 días · Riesgo: Medium
- **Referencia KB:** KB_05 §RBAC
- **Owner sugerido:** Lead Developer

---

### CRM-005 — CORS `Access-Control-Allow-Origin: *`

- **Dominio:** 5 (Seguridad)
- **Severidad:** 🔴 High
- **Descripción:** Todas las Edge Functions usan `'Access-Control-Allow-Origin': '*'` en `corsHeaders`.
- **Impacto:** Cualquier sitio web puede hacer requests a las Edge Functions autenticándose con tokens robados.
- **Evidencia:**
  ```typescript
  // shared-utils.ts:5-8
  export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    ...
  }
  ```
- **Recomendación Quick Win:** Reemplazar `*` con el dominio de producción.
  - Esfuerzo: 1-3 días · Riesgo: Low
- **Referencia KB:** KB_05 §aislamiento
- **Owner sugerido:** Lead Developer

---

### CRM-006 — Sin Idempotency Keys en Webhooks

- **Dominio:** 4 (Integraciones/Webhooks)
- **Severidad:** 🔴 High
- **Descripción:** Ningún webhook handler verifica si un evento ya fue procesado antes de ejecutar la lógica de negocio.
- **Impacto:** Webhooks duplicados pueden crear leads/eventos duplicados.
- **Evidencia:** `grep -r "idempotency" → 0 resultados`.
- **Recomendación Quick Win:** Antes de cada INSERT, verificar existencia por `external_id`.
  - Esfuerzo: 1 semana · Riesgo: Low
- **Referencia KB:** KB_04 §idempotencia
- **Owner sugerido:** Lead Developer

---

### CRM-007 — PII Hardcodeada: Email Recipients

- **Dominio:** 5 (Seguridad) + 11 (Data Governance)
- **Severidad:** 🔴 High
- **Descripción:** 4 email addresses están hardcodeados en `shared-utils.ts`.
- **Impacto:** PII expuesta en repositorio Git.
- **Recomendación Quick Win:** Mover a tabla `app_settings`.
  - Esfuerzo: 1-3 días · Riesgo: Low
- **Referencia KB:** KB_12 §PII

---

### CRM-008 — Hardcoded Agent ID y Phone Number

- **Dominio:** 5 (Seguridad)
- **Severidad:** 🔴 High
- **Descripción:** El ElevenLabs `agent_id` y su número están hardcodeados.
- **Recomendación Quick Win:** Mover a `Deno.env` o `app_settings`.
- **Referencia KB:** KB_05 §secrets

---

## 6. Plan 30/60/90 Días

### 0–30 días (Contención + Quick Wins)
... (ver informe completo) ...

---

## 7. Apéndice Técnico
... (ver informe completo) ...
