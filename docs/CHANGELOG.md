# CHANGELOG

## [Unreleased]
### Added
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
