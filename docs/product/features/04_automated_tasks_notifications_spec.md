# Specification: Automated Tasks & Notification Center

## 1. Executive Summary
**Feature:** Stage-Based Automated Tasks & Global Notification Center
**Objective:** Eliminate reliance on human memory for standard operational procedures. Automatically generate compulsory tasks when a lead changes stages and provide a centralized, highly visible "Notification Center" to ensure reps act on Overdue and Due-Today tasks, maintaining pipeline velocity.

*Designed applying principles from the `pm_crm_enterprise` and `sk_crm_web_uxui_expert_2026` skillsets.*

---

## 2. Product Management Strategy (PM View)

### 2.1 Governance by Design & Process Workflows
- **Triggers over Manual Work:** Sales Reps should not be required to manually create "standard" tasks. The system must enforce the *process workflow* automatically.
- **Architectural Approach:** Apply an `AFTER UPDATE` Database Trigger on the `leads` table. When the `stage_id` changes, the trigger evaluates the new stage and inserts predefined tasks into the `public.tasks` table. This guarantees the logic runs even if stages are changed via an API integration or bulk update, not just the Web UI.

### 2.2 Pre-defined Stage-Based Tasks
Based on standard Enterprise CRM lifecycles (`KB_12`), the following automated tasks are proposed for the Financie CRM:

| Target Stage | Generated Task Title | Type | Priority | SLA (Due Date) |
| :--- | :--- | :--- | :--- | :--- |
| **Nuevo** | Investigación inicial (LinkedIn / Web) | `research` | `med` | + 4 horas |
| **Contactado** | Enviar WhatsApp de presentación / One Pager | `follow_up` | `low` | + 24 horas |
| **Reunión Agendada** | Preparar Deck y confirmar asistencia | `meeting_prep` | `high` | - 2 horas antes de la reunión (o +24h tras cambio) |
| **Propuesta** | Seguimiento activo de propuesta Comercial | `follow_up` | `high` | + 48 horas |
| **Asignado** | Ejecutar Onboarding inicial del cliente | `onboarding` | `high` | + 24 horas |

### 2.3 Metrics & Telemetry
- **Leading Indicator:** Task Completion Rate (How many generated tasks are actually checked off?).
- **Efficiency Metric:** Average time overdue.

---

## 3. UX/UI Experience Design (Elite UX View)

### 3.1 Global Notification Center (`KB_12` Navigation)
- **Location:** Header Bar (Bell Icon with an Unread Badge for Overdue/Due Today).
- **Interaction Model:** A robust Drawer or Popover (Click to expand). Must not navigate away from the current page.
- **Context-Aware Prioritization:**
  - 🔴 **Vencidas (Overdue):** High visual priority, red accents.
  - 🟡 **Vencen Hoy (Due Today):** Warning state, yellow accents.
  - ⚪ **Próximas (Upcoming):** Neutral state.
- **UX Accelerators:** Clicking a task inside the Notification Center should navigate directly to that specific Lead's page to take action.

### 3.2 Lead Detail View Integration (`KB_02` Record Page)
- **Placement:** Tasks should have a dedicated "Próximos Pasos" (Next Steps) list placed "Above-the-fold" in the `LeadDetail` view, likely integrated near or above the `ActivityFeed`.
- **High-Frequency Flow (`KB_04`):** Completing a task must be 1-click execution using purely **Optimistic UI**. Clicking the checkbox should instantly mark it green, strike out the text, and asynchronously update the DB (`status = 'completed'`). If the DB update fails, trigger a toast error and revert state.

### 3.3 Safe Ops & Governance UX
- **Actionability:** Empty states should be friendly ("¡Todo al día! Buen trabajo").
- **Accessibility:** Ensure keyboard navigability inside the Notification Center list with focus states.

---

## 4. Technical Implementation Phases

### Phase 1: Database Automation (Backend)
1. Escribir script de semilla / mapeo para cruzar IDs de `pipeline_stages` reales con las tareas a generar (Ej. `stage-task-mappings`).
2. Crear Función en Pl/pgSQL (`fn_generate_stage_tasks`) que se ejecute en `AFTER UPDATE OF stage_id ON public.leads`.
3. Validar inserciones en la tabla `tasks` (que ya existe con `due_at`, `priority`, `status`, etc.).

### Phase 2: Frontend Data & Components
1. Extender `types.ts` si es necesario para mapear la entidad Task.
2. Crear un Contexto o Service (ej. `TaskProvider`) o un Hook de React Query para hacer fetch/pooling liviano de las `tasks` asignadas / pendientes del usuario.
3. Crear el componente `NotificationCenter` (Campanita interactiva) para el Header principal.

### Phase 3: Lead Detail Native Checklists
1. Modificar `LeadDetail.tsx` para hacer fetch de las tareas asociadas a ese `id`.
2. Crear un componente de `TaskList` interactivo (Optimistic Checkbox).

---

## Opcional: Futuras Mejoras
- **Hard Stage Gates (Next Level):** Impedir que un Lead avance de etapa si existen tareas críticas en estado `pending`.
- **Notificaciones Externas:** Conectar esta creación automática con la API de envío de correos o Slack vía webhooks si una tarea High Priority pasa a Overdue.
