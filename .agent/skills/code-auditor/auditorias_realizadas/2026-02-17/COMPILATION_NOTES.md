# COMPILATION_NOTES.md — Financie CRM Audit

> **Fecha:** 2026-02-17 · **Auditor:** CRM Code Auditor Engineer (Enterprise)

---

## 1. Herramientas Utilizadas

| Herramienta | Uso |
|---|---|
| `view_file` / `view_file_outline` | Inspección de 20+ archivos de código |
| `grep_search` | 12+ búsquedas de patrones (idempotency, console.log, CORS, secrets, etc.) |
| `find_by_name` | Inventario de archivos test, configs, workflows |
| `mcp_supabase-mcp-server_execute_sql` | 4 queries SQL: pg_tables, pg_policies, information_schema.columns, pg_indexes |
| `mcp_supabase-mcp-server_list_projects` | Identificación de proyecto Supabase |
| `view_code_item` | Inspección detallada de funciones individuales |

## 2. Accesos y Limitaciones

| Recurso | Acceso | Limitación |
|---|---|---|
| Repo source code | ✅ Completo | — |
| Supabase DB schema | ✅ Via SQL | Sin acceso a datos de producción (correcto) |
| Supabase Edge Function code | ✅ Completo | Sin acceso a logs runtime |
| Supabase Dashboard | ❌ | No visible: métricas de infra, billing, settings |
| GitHub settings | ❌ | No visible: branch protection, Actions config |
| Env vars values | ❌ | Solo nombres visibles (correcto — no se deben ver valores) |
| Integration dashboards (Meta, ElevenLabs, Brevo) | ❌ | Sin acceso a consolas de terceros |

## 3. Supuestos Documentados
... (ver notas completas) ...
