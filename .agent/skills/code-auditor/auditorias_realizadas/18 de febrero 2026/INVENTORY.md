# Inventario del Sistema - Financie CRM

> **Fecha:** 18 de febrero 2026
> **Versión:** 1.0.0
> **Auditor:** CRM Code Auditor Engineer (Enterprise)

## 1. Repositorios
- **Principal:** `financie-crm` (Local path: `c:\Users\victo\Berion Company Projects\financie-crm`)
- **Rama Auditada:** `stagingstaging` (derived from `staging-backup-erroneo`)

## 2. Entornos
- **Local:** Vite Dev Server (`localhost:5183`) conectando a Staging DB.
- **Staging:** Project `mgewvaujdsvnmaoulnwr` (Supabase), Domain `portal-staging.financiegroup.com`.
- **Producción:** Project `cnkwnynujtyfslafsmug` (Supabase).

## 3. Servicios e Infraestructura
| Servicio | Rol | Detalles |
|---|---|---|
| **Supabase** | Backend as a Service | Auth, PostgreSQL DB, Storage, Edge Functions, Realtime. |
| **Vercel** | Frontend Hosting | Hosting de la SPA (React + Vite). |
| **ElevenLabs** | AI Voice | Outbound calls, Voice Agents. |
| **Twilio** | Telephony/SMS | Proveedor de números, troncales SIP, SMS gateway. |
| **Brevo** | Marketing/CRM | Email marketing, sincronización de contactos. |
| **Calendly** | Booking | Agendamiento de citas. |

## 4. Entidades CRM Principales
- **Leads:** Prospectos entrantes (Web, Chat, etc).
- **Deals:** Oportunidades de negocio.
- **Contacts:** Personas asociadas a Leads/Deals.
- **Events:** `lead_events`, `call_events`, `sms_events`.

## 5. Integraciones (Edge Functions)
| Función | Propósito | Integración |
|---|---|---|
| `elevenlabs_webhook` | Recibe eventos de llamadas AI | ElevenLabs |
| `make_outbound_call` | Inicia llamadas salientes | ElevenLabs + Twilio |
| `sms_webhook` | Maneja SMS entrantes | Twilio |
| `call_webhook` | Maneja estado de llamadas telefónicas | Twilio |
| `sync_calendly_events` | Sincroniza citas agendadas | Calendly |
| `orchestrate_lead` | Orquestador de flujos de leads | Interno |
| `call_dispatcher` | Despacho de llamadas | Interno |

## 6. Dependencias Clave (Frontend)
- **UI Framework:** `react`, `react-dom`, `react-router-dom`
- **Styling:** `tailwindcss`, `sonner` (toasts), `lucide-react` (icons)
- **Data/Logic:** `@supabase/supabase-js`, `date-fns`, `react-calendly`
- **AI/Voice:** `@elevenlabs/elevenlabs-js`
