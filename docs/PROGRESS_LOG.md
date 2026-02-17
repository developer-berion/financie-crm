# PROGRESS_LOG

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
48: - **Próximo:** Despliegue final y monitoreo de webhooks reales.
