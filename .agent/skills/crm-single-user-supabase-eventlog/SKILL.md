---
name: crm-single-user-supabase-eventlog
description: Implementa un CRM en Supabase para 1 usuario con RLS estricto y un timeline append-only basado en eventos (lead_events). Úsalo para modelado SQL, políticas RLS, deduplicación y auditoría.
---

# CRM Supabase (1 usuario) + Event Log

## Goal
Construir un backend sólido y auditable:
- Tablas: leads, lead_events, tasks, pipeline_stages, appointments, integration_logs, call_schedules
- lead_events append-only para timeline completo
- RLS: solo 1 usuario puede acceder
- Dedup por phone normalizado

## Instructions
1) **Schema first**
- Define migraciones SQL reproducibles.
- `lead_events` append-only (sin DELETE).

2) **RLS single-user**
- Deny-all por defecto.
- Policy: `auth.uid()` debe igualar al user_id permitido.
- Nunca usar service_role en frontend.

3) **Dedup**
- Upsert por `phone_normalized` (obligatorio).
- Si coincide: evento `lead.updated_possible_duplicate`.

4) **Logs**
- Cualquier webhook/function inserta `integration_logs` con `request_id` y `message_safe`.

## Constraints
- No guardar tokens/keys en DB.
- No exponer datos sin RLS.
- Si hay correcciones, crear nuevos eventos (no “editar historia”).
