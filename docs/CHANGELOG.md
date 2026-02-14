# CHANGELOG

## [0.1.0] - 2026-02-14
### Added
- **Feature**: Lead Notes with Edit History.
    - Implementación de tablas `notes` y `note_versions`.
    - Nueva UI en `LeadDetail` para gestión de notas con soporte de versiones.
    - Modal de edición con historial de cambios.

## [Unreleased]
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
