# Financie CRM - Modern AI-Powered CRM for Insurance Agents

## Status
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Supabase](https://img.shields.io/badge/backend-Supabase-green)
![AI](https://img.shields.io/badge/AI-ElevenLabs-blue)

## Latest Updates (Jan 2026)
- **ElevenLabs Integration**: Full two-way integration with transcript storage.
- **Smart Orchestration**: Calls stop automatically ("Stop Logic") if an appointment is confirmed during the conversation.
- **Fail-safe Transcripts**: If the webhook payload is missing the transcript, the system automatically fetches it from the ElevenLabs API.
- **Enhanced UI**: New visual indicators for lead status and call outcomes.

## Project Overview - Sistema de Automatización de Leads

CRM personalizado construido con React, Vite y Supabase para la gestión automatizada de leads provenientes de Meta (Facebook/Instagram Ads). Integra servicios de Twilio y ElevenLabs para un seguimiento multicanal inmediato.

## 🚀 Características Principales

- **Gestión de Leads:** Dashboard completo para visualizar, filtrar y gestionar leads.
- **Automatización Inmediata:**  
  - SMS de bienvenida personalizado (vía Twilio) al instante de recibir el lead.
  - Llamada de Inteligencia Artificial (vía ElevenLabs) 5 minutos después.
- **Lógica de Reintentos Inteligente:**
  - Las llamadas solo se realizan en ventanas horarias específicas: **9 AM, 1 PM y 7 PM**.
  - Si no hay respuesta, el sistema reintenta 3 veces por bloque (cada 5 minutos).
  - Si el lead responde, la secuencia se detiene automáticamente.
- **Pipeline Visual:** Vista Kanban para mover leads entre etapas de venta.
- **Seguridad:** Acceso restringido vía RLS (Row Level Security) en Supabase.

## 🛠 Arquitectura y Tecnologías

- **Frontend:** React + TypeScript + Vite + TailwindCSS.
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Cron Jobs).
- **Integraciones:**
  - **Twilio:** Envío de SMS transaccionales.
  - **ElevenLabs:** Agente de voz AI para llamadas salientes. Sincronización automática de transcripciones y análisis de datos (Objetivo, Ingresos, Salud).
  - **Meta/Make:** Webhook para recepción de leads.

## ⚙️ Configuración del Proyecto

### Variables de Entorno (.env.local)

```env
VITE_SUPABASE_URL=https://[TU_PROYECTO].supabase.co
VITE_SUPABASE_ANON_KEY=[TU_CLAVE_PUBLICA]
VITE_USE_MOCK_DATA=false
```

### Webhooks y Edge Functions

1. **`meta_webhook`**: Recibe el payload de Meta/Make.
   - URL: `https://[PROYECTO].supabase.co/functions/v1/meta_webhook`
   - Acción: Guarda el lead, envía SMS y programa la llamada.
   
2. **`sms_webhook`**: Recibe estados de Twilio y mensajes entrantes.
   
3. **`call_dispatcher`**: Cron Job que corre cada 5 minutos.
   - Acción: Revisa la tabla `call_schedules` y dispara llamadas ElevenLabs si está dentro del horario y ventana de reintento.

### Base de Datos

El esquema incluye tablas clave como:
- `leads`: Información central del contacto.
- `lead_events`: Log inmutable de todas las acciones (SMS enviado, Llamada realizada, Nota agregada).
- `call_schedules`: Control del estado de los reintentos automáticos.

## 📦 Despliegue (Hostinger)

1. Ejecutar el comando de construcción:
   ```bash
   npm run build
   ```
2. El contenido de la carpeta `/dist` está listo para producción.
3. Subir todos los archivos de `/dist` a la carpeta `public_html` en el File Manager de Hostinger.
4. Asegurarse de incluir el archivo `.htaccess` (ya incluido en el build) para el manejo de rutas de React Router.

## 🔄 Flujo de Git

El proyecto ya tiene un repositorio git local inicializado con todos los cambios hasta la fecha (Features de Twilio, ElevenLabs, Nuevos campos de Meta).

Para subir a un repositorio remoto (GitHub/GitLab):
```bash
git remote add origin [URL_DE_TU_REPO]
git push -u origin master
```
