# PROJECT_CONTEXT

## Objetivo
CRM Interno minimalista para 1 Agente de Seguros, optimizado para gestionar leads de Meta Ads y citas de Calendly con un principio de "Traza de Auditoría Total" (Event Sourcing light).

## Alcance (MVP)
- **Incluido:**
  - Login (1 usuario pre-creado).
  - Ingesta de Leads desde Meta Webhooks.
  - Sincronización de Citas desde Calendly Webhooks.
  - Gestión de Pipeline (Kanban).
  - Timeline de eventos por Lead.
  - Lógica de reintentos de llamada (3 intentos/día en ventanas horarias).
- **Fuera de Alcance:**
  - Multi-tenancy (múltiples usuarios).
  - Sign-up público.
  - Integración real de voz (ElevenLabs Activo y Configurado).
  - Pagos/Facturación.

## Flujos Principales E2E
1. **Meta Lead Ads**: Lead llena formulario -> Webhook -> Edge Function -> Crea Lead + Evento `lead.received.meta` -> Dashboard.
2. **Llamada (Stub)**: Cron/Scheduler -> Edge Function `call_dispatcher` -> Verifica ventanas (9-10, 12-13, 19-20) -> Registra Evento `call.attempted`.
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
