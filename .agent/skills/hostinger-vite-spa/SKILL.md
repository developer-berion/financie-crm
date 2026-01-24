---
name: hostinger-vite-spa
description: Despliegue de SPA React+Vite en Hostinger tradicional (Apache): build dist/, .htaccess para rutas, verificación post-deploy y checklist de publicación.
---

# Hostinger Deploy para Vite SPA

## Goal
Que el CRM funcione en Hostinger con refresh en rutas profundas.

## Instructions
- `npm run build` => subir `dist/` a `public_html/`
- Agregar `.htaccess` (rewrite a index.html)
- Documentar DEPLOY_HOSTINGER.md con checklist.

## Constraints
- No asumir Node runtime en producción.
- Variables sensibles solo en Supabase.
