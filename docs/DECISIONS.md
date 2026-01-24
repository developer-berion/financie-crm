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
