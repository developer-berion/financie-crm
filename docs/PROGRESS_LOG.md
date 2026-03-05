# PROGRESS_LOG
## 2026-03-05
- **Hecho:**
  - Analisis de divergencia entre staging y codex-version (remoto y local).
  - Definicion de runbook exacto de alineacion segura sin romper hotfix de staging.
  - Documentacion del plan operativo en docs/reports/STAGING_CODEX_ALIGNMENT_PLAN_2026-03-05.md.
- **Decisiones tomadas:** [Estrategia de alineacion bidireccional staging <-> codex-version](./DECISIONS.md)
- **Bloqueos:**
  - `test:smoke` en estado rojo local por imports faltantes (`useAuth`, `authContextCore`), debe resolverse antes de promocion.
- **Proximo:**
  - Ejecutar rama de integracion codex/staging-align-20260305 y gates completos.
  - Merge a staging y fast-forward de codex-version para convergencia 100%.

## 2026-02-27
- **Hecho:**
  - Implementación de validador operativo `validate:post-rotation` con chequeos de guardrail, secretos, REST, `system_integrity` y revisión de errores auth recientes.
  - Desactivación explícita de comunicaciones IA en staging mediante `ENABLE_TWILIO_ELEVENLABS=false`.
  - Ajuste de funciones para modo desactivado:
    - `elevenlabs_webhook` devuelve `202` (skipped) en vez de `500`.
    - `system_integrity` marca ElevenLabs/Twilio como `SKIPPED` cuando corresponde.
  - Actualización de llaves locales de staging en `.env.local` (`VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) para eliminar drift.
  - Deploy a staging de `elevenlabs_webhook` y `system_integrity`.
  - Registro de evidencia en ClickUp y cierre de subtask `86e02z672` (status `complete`).
- **Resultados:**
  - `npm run validate:post-rotation` en PASS para checks críticos.
  - ElevenLabs deja de generar falso incidente operativo mientras está fuera de alcance.
- **Próximo:**
  - Continuar con P0 de rotación completa y verificación de consumidores externos remanentes.

## 2026-02-21
- **Hecho:**
  - Depuración profunda de la integración de Calendly en entornos locales y staging.
  - Implementación de unit tests para verificación de firmas Webhook (HMAC-SHA256).
  - Creación de suite de pruebas para el Dashboard (Revenue Forecast, Upcoming Appointments).
  - Implementación de 12 nuevos archivos de test unitarios, alcanzando 294 tests exitosos.
  - Documentación de las causas raíz de los fallos de Calendly en `INTEGRATIONS_RUNBOOK.md`.
- **Decisiones tomadas:** [Testing Exhaustivo y Diagnóstico de Integraciones]
- **Bloqueos:** Ninguno.
- **Próximo:** Despliegue en Vercel Staging y corrección de los 5 tests pre-existentes de constantes.

## 2026-01-21
- **Hecho:**
  - Inicialización de documentación en `/docs`.
  - Definición de Plan de Implementación y Task List en `/brain`.
  - Configuración inicial de estructura de proyecto (mental/plan).
- **Decisiones tomadas:** [Arquitectura Serverless en Hostinger + Supabase](./DECISIONS.md)
- **Bloqueos:** Ninguno por el momento.
- **Próximo:** Crear estructura de proyecto Vite y configurar Supabase CLI/Migrations.
## 2026-01-24
- **Hecho:**
  - Integración completa de Twilio (SMS personalizados inmediatos).
  - Integración completa de ElevenLabs (Llamadas AI con reintentos).
  - Implementación de `call_dispatcher` en Supabase con lógica de ventanas horarias.
  - Configuración de Webhooks y secretos en Supabase.
  - Pruebas exitosas de despliegue de Edge Functions.
  - **Actualización:** Cambio de número de teléfono de Twilio a (786) 321-2663.
- **Decisiones tomadas:** Cambio de estrategia de SMS inicial a ElevenLabs Call 5 min después para maximizar conversión.
- **Próximo:** Empaquetar el proyecto para Hostinger.
## 2026-01-25
- **Hecho:**
  - Depuración de integración ElevenLabs (problema de cuelgue en buzón).
  - Actualización del Prompt del Agente con reglas estrictas de `Voicemail Detection`.
  - Optimización de la función `make_outbound_call` (eliminación de parámetros conflictivos).
  - Verificación manual y despliegue exitoso de Edge Function.
  - Ejecución local del proyecto y revisión visual del Dashboard.
- **Decisiones tomadas:** Se confía la detección de buzón enteramente a la IA del Agente (Prompt) en lugar de flags de API (`detect_voicemail`) que causaban conflictos (status stuck in `initiated`).
- **Próximo:** Finalizar build y push a repositorio.
## 2026-01-26
- **Hecho:**
  - Compilación exitosa del cliente (`npm run build`).
  - Actualización de `Login.tsx` (ajustes visuales/funcionales).
  - Optimización de Edge Functions (`make_outbound_call`, `meta_webhook`) y utilidades compartidas.
  - Creación de migración SQL para columnas de contexto de registro (`signup_context`).
  - Actualización de documentación y sincronización con repositorio remoto.
- **Decisiones tomadas:** Se consolidan los cambios recientes en un solo commit de mantenimiento y mejoras.
- **Próximo:** Despliegue en producción (Hostinger) y monitoreo de nuevos leads.

## 2026-01-29
- **Hecho:**
    - Se eliminó la duplicidad de llamadas (conflicto Cron vs Trigger).
    - Optimización "Speed to Lead": Delay reducido de 5 min a 1 min.
    - Lógica de Reintentos: 3 intentos c/5 min para jobs fallidos.
    - Dashboard: Ahora consume de `jobs` (fuente real).
    - Limpieza: Eliminado job `twilio-dispatcher` obsoleto.
- **Bloqueos:**
    - Verificación automática de fallo saltó por constraint FK (esperado), validado vía código.
- **Próximo:**
    - Monitorear tasa de contacto con nuevo delay.
## 2026-02-14
- **Hecho:**
    - Implementación completa de "Notas de Lead" con historial de versiones y archivado.
    - Reordenamiento de UI en `LeadDetail` (Notas arriba, AI Call Card abajo).
    - Estilización de sección de notas (diferenciación visual).
    - Corrección de enlace en correos de notificación (`View Lead in CRM` ahora usa `APP_URL`).
    - Despliegue de `orchestrate_lead` Edge Function con la corrección.
    - Reemplazo de `health_monitor` (falsos positivos) por `system_integrity`.
    - Nueva función de monitoreo verifica: Base de Datos (Lectura), ElevenLabs (Créditos Reales), Brevo (Plan), Twilio (Estado), y Webhooks (Latencia).
    - Se eliminó la creación de leads de prueba para el monitoreo.
- **Decisiones tomadas:** Se prioriza la entrada manual de notas sobre la información generada por AI para mejorar el flujo de trabajo de los agentes.

- **Próximo:** Monitorear uso de notas y funcionamiento de enlaces en correos.

## 2026-02-17
- **Hecho:**
    - Reestructuración completa del Dashboard principal.
    - Implementación de 5 componentes especializados (`StatCard`, `PipelineFunnel`, `ActivityFeed`, `UpcomingAppointments`, `AgentsSummary`).
    - Migración de datos hardcodeados a queries reales (`leads`, `lead_events`, `appointments`, `jobs`, `agentes`).
    - Optimización de performance con `Promise.all` para carga paralela de métricas.
    - Sincronización visual de etapas de pipeline con colores consistentes a través del CRM.
- **Decisiones tomadas:** [Carga Paralela y Desacoplamiento de LeadTable](./DECISIONS.md)
- **Bloqueos:** Ninguno.
- **Próximo:** Monitorear latencia de carga con volumen real de eventos.
37: 
40: ## 2026-02-17 (Continuación)
41: - **Hecho:**
42:     - Integración completa de Características de IA (Transcripciones, Resúmenes).
43:     - Actualización de `ActivityFeed` y `Timeline` con indicadores de IA.
44:     - Activación oficial de `call_dispatcher`.
45:     - Limpieza de `config.toml` (eliminación de funciones obsoletas).
46:     - Verificación de Build y Unit Tests exitosa.
47: - **Decisiones tomadas:** Se reactiva el despachador de llamadas tras verificar la estabilidad de la integración con ElevenLabs.
- **Próximo:** Despliegue final y monitoreo de webhooks reales.

## 2026-02-20
- **Hecho:**
    - Implementación de Stage-Specific UI (Dynamic Layouts) para Smart Leads: `StageTracker`, `EarlyStageView`, `MidStageView`, `LateStageView`.
    - Implementación de Hooks (`useDuplicateDetector`, `useDebounce`) e Interfaz UI (`DataIntegrityIndicator`, `MergeConflictModal`) para el Motor Anti-Duplicados (Anti-Duplicate Engine).
    - Creación de Migración SQL `20260220183546_add_deduplication_rpcs.sql` habilitando `pg_trgm`.
    - Modificado `LeadQuickAdd` para interceptar duplicados e inyectar el conflict modal.
- **Decisiones tomadas:** [Anti-Duplicate Engine con Diff Before Apply](./DECISIONS.md)
- **Bloqueos:**
    - El entorno de Staging (`mgewvaujdsvnmaoulnwr`) tenía el historial de migraciones corrupto/desincronizado con respecto a local. Se reparó con `repair --status applied/reverted`, sin embargo, la última migración falló al ser subida por conflictos previos en el historial de `supabase/migrations`.
- **Próximo:**
    - Subir el código a Git para no perder cambios de UI y SQL.
    - Resolver limpiar/resetear la DB de Staging o hacer squash de migraciones para la correcta subida de los RPCs del Anti-Duplicate Engine.
    - Testear el flujo E2E del Merge Conflict.

## 2026-02-20 (Continuación)
- **Hecho:**
    - Implementación completa de "Pipeline Governance: Validation Rules (Stage Gates)".
    - Creación de Migración SQL instalando un `BEFORE UPDATE` trigger en `leads` para asegurar data obligatoria ('Propuesta' -> valor > 0, 'Cerrado Ganado' -> contrato firmado/URL).
    - Desarrollo Frontend de `StageGateModal.tsx` y motor en `lib/stage-gates.ts`.
    - Integración de "Ghost Drops" y "Visual Gatekeepers" (íconos Lock) en `KanbanBoard`.
    - Actualización de `StageTracker` en `LeadDetail` para interceptar cambios inválidos.
    - Modificación de `LateStageView` para que componentes requieran los campos del `contract_details` JSONB.
- **Próximo:** 
    - Pruebas manuales E2E del sistema de Gates por parte del usuario.

## 2026-02-20 (Task Management)
- **Hecho:**
    - Implementación completa de "Manual Task Creation" con `TaskModal.tsx`.
    - Desarrollo del "Automated Reminder Engine" via Edge Function (`task-reminders`) y `pg_cron`.
    - Actualización de esquema de DB (`tasks` table) y utilidades de email (`sendTaskReminderEmail`).
    - Integración visual de creación de tareas en `LeadDetail` y `Tasks` page.
- **Decisiones tomadas:** [Asignación Automática y Recordatorios de Doble Capa (24h/1h)](./DECISIONS.md)
- **Bloqueos:** Ninguno.
- **Próximo:** Commit a staging y despliegue final.

## 2026-02-20 (Technical Audit)
- **Hecho:** Ejecución de `scan_profundo`. Mapeo de inventario y flujos críticos. Generación de reporte de riesgos.
- **Hallazgos:** Riesgos medios-altos en RLS de notas y autenticación de webhooks Meta.
- **Próximo:** Aplicar parches de seguridad y documentación de remediación.

