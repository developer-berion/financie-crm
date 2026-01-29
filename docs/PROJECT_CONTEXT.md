# PROJECT_CONTEXT

## Objetivo
CRM Interno minimalista para 1 Agente de Seguros, optimizado para gestionar leads de Meta Ads y citas de Calendly con un principio de "Traza de Auditoría Total" (Event Sourcing light).

## Alcance (MVP)
> **Documentación Técnica Detallada:**
> - [Arquitectura](ARCHITECTURE_SPEC.md)
> - [Diccionario de Datos](DB_DICTIONARY.md)
> - [Catálogo de API](API_CATALOG.md)

- **Incluido:**
  - Login (1 usuario pre-creado).
  - Ingesta de Leads desde Meta Webhooks.
  - Sincronización de Citas desde Calendly Webhooks.
  - Gestión de Pipeline (Kanban).
  - Timeline de eventos por Lead.
  - Lógica de reintentos de llamada (3 intentos/día en ventanas horarias).
  - **Llamada Manual IA**: Botón para disparar llamada inmediata desde el perfil del lead.
  - **Gestión de Jobs**: Posibilidad de cancelar llamadas programadas manualmente.
- **Fuera de Alcance:**
  - Multi-tenancy (múltiples usuarios).
  - Sign-up público.
  - Integración real de voz (ElevenLabs Activo y Configurado).
  - Lógica de parada automática si se confirma agenda en llamada.
  - Recuperación de transcripciones desde API si faltan en webhook.
  - Pagos/Facturación.

## Flujos Principales E2E
1. **Meta Lead Ads**: Lead llena formulario -> Webhook -> Edge Function -> Crea Lead + Evento `lead.received.meta` -> Dashboard.
2. **Llamada (IA)**: Cron/Scheduler -> Edge Function `make_outbound_call` -> ElevenLabs Agent -> Webhook `elevenlabs_webhook`.
    - Si agenda cita: Cancela futuros intentos y jobs pendientes.
    - Si no contesta: Reagendar según lógica de reintentos.
    - Transcripción se guarda en `conversation_results`.
3. **Calendly**: Usuario agenda -> Webhook -> Edge Function -> Crea Appointment + Mueve Stage -> Evento `appointment.scheduled`.
4. **Gestión Manual**: Agente mueve tarjeta en Kanban -> Evento `pipeline.stage_changed`.

## Principios
- **"Todo es un evento"**: No solo se guarda el estado actual, sino qué pasó y cuándo (`lead_events` table).
- **Single Tenant Hardcoded**: Seguridad simplificada via RLS para un solo UID/Email.
- **Stateless Backend**: Todo corre en Edge Functions efímeras (150s timeout).

## Stack & Constraints
- **Frontend**: React + Vite + Tailwind (TypeScript).
- **Backend**: Supabase (Postgres, Auth, Edge Functions). NO Node.js server.
- **Hosting**: Hostinger (Plan compartido/cloud) sirviendo archivos estáticos (SPA).
- **Base de Datos**: Supabase Free Tier.

## Glosario de Estados/Etapas
- **Status (Lead)**: `Nuevo`, `En contacto automático`, `Contactado`, `No contactado`, `Cita agendada`, `Requiere seguimiento`, `No interesado`, `Cerrado ganado`, `Duplicado`.
- **Pipeline Stages**: 
  1. Lead Nuevo (Meta)
  2. Llamada en curso
  3. Contactado - Calificando
  4. Cita Agendada
  5. Cita Completada
  6. Propuesta
  7. Cerrado Ganado
  8. Cerrado Perdido
