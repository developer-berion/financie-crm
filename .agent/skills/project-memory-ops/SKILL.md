---
name: project-memory-ops
description: Mantén “memoria externa” del proyecto en /docs (contexto, decisiones, avances, changelog y runbook de integraciones). Úsalo cada vez que cambie arquitectura, DB, integraciones o deploy.
---

# Project Memory Ops (/docs)

## Goal
Evitar pérdida de contexto y facilitar retomar el proyecto:
- PROJECT_CONTEXT.md = fuente de verdad del producto
- DECISIONS.md = motivos y tradeoffs (ADR-lite)
- PROGRESS_LOG.md = historial de avances y bloqueos
- CHANGELOG.md = cambios funcionales visibles
- INTEGRATIONS_RUNBOOK.md = setup + debugging de integraciones

## When to use
- Cambios en arquitectura, seguridad (RLS/Auth), esquema DB/migraciones
- Cambios en webhooks, firmas, variables env
- Cambios en deploy (Hostinger, rutas SPA)
- Cualquier ajuste que “mañana” no se recuerde fácil

## Instructions
1) Antes de implementar un cambio grande:
- Añade entrada en DECISIONS.md si hay decisión real (alternativas + motivo).

2) Después de implementar:
- PROGRESS_LOG.md: qué se hizo + por qué + links (PR/diff/ADR).
- CHANGELOG.md: solo si afecta UX/funcionalidad visible.
- INTEGRATIONS_RUNBOOK.md: si toca integraciones/env vars/firmas.

## Templates
DECISIONS.md entry:
## YYYY-MM-DD — <Título>
**Contexto:** …
**Decisión:** …
**Alternativas:** …
**Por qué:** …
**Impacto:** …
**Seguimiento/TODO:** …

PROGRESS_LOG.md entry:
## YYYY-MM-DD
- Hecho:
- Decisiones (link):
- Bloqueos:
- Próximo:

## Constraints
- Mantener docs cortos y escaneables.
- No duplicar contenido: cada doc tiene un propósito único.
- No incluir secretos en docs.
