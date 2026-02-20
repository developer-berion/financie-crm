# CHANGELOG

## [0.1.0] - 2026-02-14
### Added
- **Feature**: Lead Notes with Edit History.
    - Implementación de tablas `notes` y `note_versions`.
    - Nueva UI en `LeadDetail` para gestión de notas con soporte de versiones.
    - Modal de edición con historial de cambios.
    - **Archiving**: Sistema de archivado y restauración de notas con vista dedicada.

## [2026-02-20] - Task Management & Automated Reminders

### Added
- **Feature**: Manual Task Creation.
    - Componente `TaskModal` para creación de tareas ad-hoc con asignación automática.
    - Integración de botones "+ Nueva Tarea" en `LeadDetail` y página global de `Tasks`.
    - Soporte para prioridad, fecha de vencimiento y tipos de tarea personalizados.
- **Feature**: Automated Reminder Engine.
    - Edge Function `task-reminders` para escaneo horario de tareas por vencer.
    - Integración con Brevo para envío de recordatorios (24h y 1h antes del deadline).
    - Cron Job en Supabase (`process-task-reminders`) para ejecución automatizada.
- **Database**: 
    - Nuevas columnas `assigned_to` y `reminders_sent` en la tabla `tasks`.
    - Índice optimizado `idx_tasks_due_reminders` para escaneo de vencimientos.

## [2026-02-20] - Pipeline Governance, Task Management & Audit

### Added
- **Feature**: Manual Task Creation.
    - Nuevo modal premium `TaskModal.tsx` para creación rápida.
    - Integración en `LeadDetail` y global `Tasks` page.
- **Feature**: Automated Reminder Engine.
    - Edge Function `task-reminders` con lógica de 24h/1h.
    - Programación vía `pg_cron` cada hora.
    - Emails transaccionales vía Brevo con branding corporativo.
- **Audit**: Deep Code Audit (v1.0.0).
    - Generación de `PRODUCT_AUDIT_REPORT.md` e `INVENTORY.md`.
    - Identificación de riesgos críticos en RLS y Webhooks.

### Improved
- **Stability**: Optimización de `shared-utils.ts` con fetch retries y enmascaramiento de PII.
- **UX**: Navegación mejorada en el Dashboard de Tareas.
    - Database `BEFORE UPDATE` Trigger para asegurar la integridad de datos ('Propuesta' y 'Cerrado Ganado').
    - Componente `StageGateModal` inyectando UI de requerimientos "Just-in-Time" para resolver conflictos pre-guardado.
    - Interceptores en Kanban ("Ghost Drop" pattern) e íconos "Lock" explicativos en `KanbanHeader`.
    - Actualizado `StageTracker` y `LateStageView` para permitir entrada orgánica de `contract_details` requeridos por las reglas.

## [2026-02-20] - Smart Leads: Dynamic Layouts & Anti-Duplicate Engine

### Added
- **Feature**: Anti-Duplicate Engine.
    - Detección asíncrona de duplicados usando `pg_trgm` (Exacto y 80%+ Fuzzy match).
    - Nuevo `DataIntegrityIndicator` para UX asíncrona de revisión de datos.
    - Componente `MergeConflictModal` para resolución de conflictos (Diff Before Apply).
    - Prevención estricta en `LeadQuickAdd` de crear leads si un conflicto existe (fuerza la revisión/merge).
- **Feature**: Dynamic Layouts (Stage-Specific UI).
    - Introducidos `EarlyStageView`, `MidStageView` y `LateStageView` para modificar densidad visual basada en Stage.
    - Componente interactivo `StageTracker` para navegar estados.
    - Implementados campos de cabecera fijos ("Sticky header") para `Priority` y `Close Date`.

### Changed
- Configuración de la CLI de Supabase actualizada explícitamente a Staging.

## [2026-02-17] - Dashboard Restructuring & Real-Time Metrics

### Added
- Created 5 new dashboard sub-components: `StatCard`, `PipelineFunnel`, `ActivityFeed`, `UpcomingAppointments`, and `AgentsSummary`.
- Implemented `PipelineFunnel` with horizontal bar visualization and RevOps stage coloring.
- Implemented `ActivityFeed` connected to `lead_events` for audit trail visibility.
- Imerging `UpcomingAppointments` to show Calendly synced data directly on Dashboard.

### Changed
- Complete rewrite of `Dashboard.tsx` to replace hardcoded data with real Supabase queries.
- Shifted to parallel data fetching using `Promise.all` for performance optimization.
- Improved header with dynamic date and consistent layout.
- Decoupled `LeadTable` from Dashboard to focus on high-level KPIs and activity.

---
### Changed
- **Automation**: Suspensión temporal de llamadas automáticas (`INITIAL_CALL`) y despacho de agenda.
- **Integration**: Desactivación de la sincronización automática de Calendly.
- **Integration**: Actualización y verificación del Token de API de Calendly.
- **Frontend**: Ocultación del botón de sincronización manual en la vista de Agentes.

### Added
- **Database**: Nuevo campo `bot_verification` en tabla `leads` para almacenar retos anti-bot.
- **Frontend**: Campo "Verificación Anti-Bot" en `LeadDetail` (Layout 4 columnas).
- **Module: Agentes**: Nuevo módulo para gestión de postulantes (separado de Leads).
- **Integration**: Sincronización automática de eventos de Calendly con la tabla `agentes`.
- **Security**: Implementación de Lista Negra (Blacklist) para SMS entrantes de Twilio.
- **Automation**: Cron job horario (`0 * * * *`) para mantener la agenda actualizada.
- **Frontend**: 
    - Nueva vista "Agentes" (Listado y Detalle).
    - Botón "Manual Sync" con cooldown de 5 minutos para actualización bajo demanda.
- Feature: Dashboard "Llamadas Pendientes" now reflects real-time job queue (jobs table).
- Improvement: Call latency reduced from 5m to 1m for "Speed to Lead".
- Reliability: Automatic retry mechanism (3 attempts) for failed calls.
- Integración con Twilio para envío de SMS automáticos personalizados.
- Integración con ElevenLabs para llamadas AI salientes con lógica de reintentos.
- Lógica de seguimiento basada en bloques horarios (9 AM, 1 PM, 7 PM).
- Documentación detallada de integraciones y Webhooks.
- Configuración de Cron Job en Supabase para el despachador de llamadas.
- Soporte para nuevos campos de leads: Estado/Región, Términos Aceptados y Fecha Meta.
- Corrección de políticas RLS para acceso universal de usuarios autenticados.
- Implementación de reglas de detección de buzón de voz (ElevenLabs) para colgar automáticamente.
- Despliegue de función `make_outbound_call` con parámetros optimizados.
- Soporte extendido en webhook de Meta y nuevas columnas `signup_context` para atribución de leads.
- Ajustes de diseño y usabilidad en página de Login.
