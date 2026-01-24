---
name: webhooks-signed-meta-calendly
description: Implementa webhooks firmados para Meta (X-Hub-Signature-256) y Calendly (Calendly-Webhook-Signature), con logs y respuesta rápida (ack) en Supabase Edge Functions.
---

# Webhooks Firmados (Meta + Calendly)

## Goal
Procesar webhooks de forma segura:
- Validación de firmas
- Ack rápido
- integration_logs para auditoría

## Instructions
- Meta:
  - Verificar GET challenge
  - En POST, validar X-Hub-Signature-256 con App Secret antes de parsear la lógica de negocio.
- Calendly:
  - Validar Calendly-Webhook-Signature con signing key si está disponible.
- Siempre:
  - generar request_id
  - loggear success/failure/ignored
  - no loggear secretos

## Constraints
- Si firma inválida: responder 401 y log status=failure.
- No hacer tareas pesadas antes del ack; si hace falta, delegar a job/scheduler.
