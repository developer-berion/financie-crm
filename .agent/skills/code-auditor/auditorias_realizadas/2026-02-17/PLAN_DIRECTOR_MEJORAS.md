# PLAN DIRECTOR DE MEJORAS — CRM AUDIT REMEDIATION

> **Fecha:** 2026-02-17
> **Alcance:** Implementación de correcciones basadas en Auditoría `scan_profundo`.
> **Estrategia:** "Security First" -> "Stabilization" -> "Scale".

---

## 1. Análisis de Riesgos de Desarrollo (Dev Risk Analysis)

Antes de tocar una sola línea de código, identificamos los riesgos de estas modificaciones:

| Riesgo                                         | Probabilidad | Impacto  | Mitigación                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Interrupción de Servicio (Downtime)** | Media        | Alto     | Los cambios en Webhooks (Firmas/Secrets) pueden rechazar tráfico legítimo si las Env Vars no coinciden exactamente.**Mitigación:** Verificar Env Vars en Dashboard antes de deploy.                                                                                                                                                                                                                                                                       |
| **Pérdida de Datos (Logs)**             | Baja         | Medio    | La sanitización de logs podría ocultar información útil para debugging si es demasiado agresiva.**Mitigación:** Mantener IDs (lead_id) visibles, solo enmascarar PII.                                                                                                                                                                                                                                                                                   |
| **Bloqueo de Integraciones (CORS)**      | Media        | Alto     | Restringir CORS puede romper clientes no documentados (ej: scripts de Zapier o landings externos).**Mitigación:** Loggear el `Origin` de requests rechazados inicialmente (modo "Dry Run" opcional) o confirmar lista de dominios. Los dominios son: "https://financiegroup.com/agentes/" y "https://financiegroup.com/landing-iul/". Tambien servicios como calendly, pero debes buscar que dominios exactamente se usan aquí, entre otros está brevo. |
| **Regresión en Flujo de Ventas**        | Baja         | Crítico | Cambios en `shared-utils` afectan a todas las funciones. **Mitigación:** Tests manuales e2e tras el deploy en la rama de prueba.                                                                                                                                                                                                                                                                                                                          |

---

## 2. Plan General de Mejoras (Roadmap por Fases)

### Fase 1: "Stop the Bleeding" (Seguridad y Privacidad) — **FOCUS ACTUAL**

*Objetivo: Cerrar vulnerabilidades críticas y cumplir normativas de datos.*

- **Quick Wins:** Webhook Secrets, Firmas Twilio, Logs Sanitizados.
- **Config:** Mover hardcoded values a Env Vars/App Settings.
- **Access:** RLS Policies y CORS.

### Fase 2: "Stabilize Operations" (Calidad y Automatización)

*Objetivo: Mejorar la experiencia de desarrollo (DX) y reducir deuda técnica.*

- **CI/CD:** Pipeline básico en GitHub (Linting).
- **Testing:** Unit tests para orquestación y validadores.
- **Code Cleanup:** Eliminar código muerto (`mockLeads`, dependencias duplicadas).

### Fase 3: "Scale & Optimize" (Performance y Governance)

*Objetivo: Preparar para escala 10x.*

- **Performance:** Optimizar Dashboard (N+1 Queries).
- **FinOps:** Monitoreo de costos por feature.
- **Governance:** Políticas de retención de datos y archivado.

---

## 3. Plan Específico: Fase 1 (Detalle de Tareas)

Esta fase se ejecutará en la rama `fix/audit-phase-1-security`.

### Grupo A: Gestión de Secretos e Identidad (CRM-001, CRM-008, CRM-002)

1. **[High]** Refactorizar `elevenlabs_webhook`: Eliminar fallback string `wsec_...`.
2. **[High]** Refactorizar `make_outbound_call`: Mover `agentId` a variable de entorno.
3. **[High]** Activar verificación de firma en `sms_webhook` y `call_webhook` (Twilio).

### Grupo B: Privacidad de Datos y Logs (CRM-003, CRM-007)

4. **[Critical]** Crear utilidad `safeLog` en `shared-utils.ts`.
5. **[Critical]** Auditar y reemplazar todos los `console.log` que impriman objetos `lead`, `payload` o `body` crudos.
6. **[Medium]** Mover lista de emails `recipients` de `shared-utils.ts` a `app_settings` (o Env Var como paso intermedio rápido).

### Grupo C: Control de Acceso (CRM-004, CRM-005)

7. **[High]** Modificar `corsHeaders` en `shared-utils.ts`: Reemplazar `*` con `https://crm.financiegroup.com` (y lógica para localhost).
8. **[High]** Generar script SQL para revocar policies `anon` en tabla `agentes`.

---

## 4. Estrategia de Entorno de Pruebas

Siguiendo la solicitud del usuario:

1. **Git Branching:** Se creará la rama `fix/audit-phase-1-security` desde `main`.
2. **Isolation:** Los cambios de código viven en esta rama.
3. **Deploy:** Para probar las Edge Functions, se recomienda usar el comando de deploy apuntando a esta rama, o idealmente (si se tuviera un proyecto Supabase de staging) desplegar allí. *Nota: Dado que solo tenemos un proyecto prod, el deploy de funciones sobrescribirá las de producción. Se debe proceder con extrema cautela o usar `supabase functions serve` localmente para validaciones con `ngrok` si es posible, o validación de código estática.*

> **Advertencia:** Al no tener un proyecto de Supabase "Staging" separado, desplegar las Edge Functions desde la rama `fix/...` **AFECTARÁ PRODUCCIÓN**. La "rama" de Git aísla el código, pero el `deploy` sube a la nube viva.
> **Recomendación:** Haremos los cambios en código (Git) primero. Para el deploy, confirmaremos uno a uno.
