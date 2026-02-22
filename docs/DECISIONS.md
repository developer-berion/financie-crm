# DECISIONS

## 2026-01-21 — Arquitectura Serverless en Hostinger + Supabase
**Contexto:**
Se requiere desplegar un CRM para un solo usuario minimizando costos fijos y aprovechando infraestructura existente (Hostinger) y tiers gratuitos (Supabase).

**Decisión:**
Implementar una SPA (Single Page Application) con React/Vite alojada en Hostinger, relegando toda la lógica de backend, base de datos y autenticación a Supabase (Postgres + Edge Functions).

**Alternativas consideradas:**
1. **VPS (DigitalOcean/Droplet)**: Mayor control, permite Node.js persistente, pero requiere mantenimiento de SO y costo extra.
2. **Vercel/Netlify**: Buena integración con Next.js, pero límites en serverless functions en free tier y posible vendor lock-in de features específicos.

**Por qué:**
- **Costos**: Hostinger ya es un recurso pagado. Supabase Free cubre holgadamente el volumen de 1 usuario.
- **Mantenimiento**: No hay servidor que parchar/actualizar.
- **Escalabilidad**: Suficiente para el volumen de leads esperado.

**Impacto:**
- **Desarrollo**: Debemos usar Supabase Edge Functions (Deno) en lugar de un servidor Express/NestJS tradicional.
- **Limitaciones**: No podemos tener procesos de larga duración (background jobs pesados) en el mismo hosting; dependemos de Cron/Webhooks rápidos.
- **Seguridad**: RLS (Row Level Security) es crítico ya que el cliente habla directo con la DB.

**Seguimiento / TODO:**
- Configurar `.htaccess` en Hostinger para manejar rutas de React Router.
- Asegurar cold-start tiempos aceptables en Edge Functions.

## 2026-02-17 — Dashboard Data-Driven & Parallel Fetching
**Contexto:**
El dashboard anterior usaba métricas hardcodeadas y componentes genéricos que no aportaban valor al agente. La carga secuencial de datos causaba parpadeos visuales y delay.

**Decisión:**
1. Reestructurar el dashboard usando 5 sub-componentes especializados.
2. Implementar queries directas a Supabase usando `Promise.all` para carga paralela.
3. Desacoplar la tabla de leads `LeadTable` del dashboard para priorizar KPIs agregados y feeds de actividad.

**Por qué:**
- **Performance**: El tiempo de carga total se reduce al tiempo de la query más lenta, en lugar de la suma de todas.
- **UX**: Los componentes especializados permiten una jerarquía de información más clara (RevOps Funnel).
- **Mantenibilidad**: Es más fácil modificar una métrica específica sin afectar todo el dashboard.

**Impacto:**
- **Frontend**: Requiere suscripciones en tiempo real o recargas manuales para reflejar cambios inmediatos (implementado vía `useEffect`).
- **DB**: Incrementa ligeramente la concurrencia de conexiones a Postgres en el mount del Dashboard, pero sigue dentro de los límites del Free Tier.

## 2026-02-20 — Anti-Duplicate Engine con Diff Before Apply
**Contexto:**
Se necesitaba implementar un mecanismo para evitar la creación de leads duplicados (Feature 3: Anti-Duplicate Engine) asegurando la integridad de los datos ("Golden Record") sin crear conflictos ni borrar historial silenciosamente.

**Decisión:**
1. Crear funciones RPC en Supabase (`check_lead_duplicates` y `merge_leads`) usando `pg_trgm` para fuzzy matching (>80%) en nombres, y coincidencias exactas en email y teléfono.
2. Implementar un patrón "Diff Before Apply" en el frontend mediante el componente `MergeConflictModal`.

**Alternativas:**
1. Deduplicación silenciosa en base de datos (Trigger en Insert). *Rechazada*: Podaría silenciosamente datos dispares ingresados por un agente.
2. Procesamiento Async en Edge Functions post-creación. *Rechazada*: Complica el feedback inmediato al agente en el UI.

**Por qué:**
- **Seguridad y Control (Safe Ops)**: Permite al usuario/agente tomar la última decisión sobre qué campo sobrevive ante un conflicto, en lugar de una regla ciega.
- **Trazabilidad**: Todo merge genera un evento `system.merged_on_create` en el timeline del lead sobreviviente (Auditoría).

**Impacto:**
- **Performance**: El check asíncrono sobre la API (`useDuplicateDetector`) podría agregar latencia en formularios, mitigado con un `useDebounce` de 500ms.
- **Base de Datos**: Se habilitó la extensión `pg_trgm` que incrementa marginalmente el tamaño de indexación en la tabla de leads.
- **Deploy**: Requiere resolución de estado local/remoto de migraciones de Supabase en Staging para poder aplicar el código RPC en la DB del servidor real.

## 2026-02-20 — Asignación Automática y Recordatorios de Doble Capa
**Contexto:**
Se requería un sistema de gestión de tareas que permitiera creación manual y asegurara que el agente sea notificado proactivamente antes del vencimiento.

**Decisión:**
1. **Asignación Automática**: Por simplicidad para un entorno de 1 solo usuario (o dueño del lead), las tareas manuales se asignan por defecto al usuario que las crea (`auth.uid()`), y las automáticas al dueño del lead.
2. **Recordatorios de Doble Capa**: Implementar dos notificaciones vía email (Brevo) a las 24h y 1h antes del vencimiento para maximizar el cumplimiento de SLAs sin saturar al usuario.
3. **Escaneo Horario**: El motor de recordatorios corre cada hora, ofreciendo un balance entre precisión y consumo de recursos.

**Por qué:**
- **Eficiencia**: Reduce la fricción al crear tareas (menos clicks).
- **Fiabilidad**: La doble capa asegura que tareas críticas (SLAs cortos) y de largo plazo sean recordadas en momentos clave.
- **Simplicidad técnica**: Usar `pg_cron` + Edge Functions mantiene el sistema dentro de la infraestructura de Supabase sin dependencias externas complejas.

**Impacto:**
- **UX**: Incremento en la proactividad del agente.
- **Database**: Adición de una columna JSONB (`reminders_sent`) para evitar duplicidad de correos ante posibles reintentos del cron.
