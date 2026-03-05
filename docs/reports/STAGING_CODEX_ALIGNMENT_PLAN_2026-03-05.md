# Plan Exacto: Alinear `staging` y `codex-version` sin romper hotfix

Fecha: 2026-03-05  
Owner: Release Engineering (Codex)  
Objetivo: mover la ultima mejora de `codex-version` a `staging`, mantener hotfixes de `staging`, y dejar ramas remotas + locales 100% alineadas.

## 1) Estado actual verificado

- `origin/staging` -> `8735d02`
- `origin/codex-version` -> `47d4fbc`
- Divergencia remota: `git rev-list --left-right --count origin/staging...origin/codex-version` => `4 1`
  - `codex-version` tiene 1 commit funcional no incorporado en `staging`: `47d4fbc`
  - `staging` contiene merges/hotfix de despliegue ya ejecutados.
- Local:
  - `codex-version` local alineada a remoto.
  - `staging` local atrasada 10 commits respecto a `origin/staging`.

## 2) Estrategia de no-ruptura

Principio: `staging` manda en continuidad operativa (hotfix), `codex-version` aporta la ultima mejora.

Secuencia segura:
1. Integrar `origin/codex-version` sobre base `origin/staging` en rama temporal.
2. Ejecutar gates tecnicos y validaciones funcionales.
3. Merge a `staging`.
4. Fast-forward de `codex-version` a `staging` para igualdad total.
5. Fast-forward local de ambas ramas.

Con este orden, no se pierde hotfix de `staging` y ambas ramas terminan en el mismo SHA.

## 3) Ejecucion exacta (comandos)

### Fase 0 - Preflight y backup

```bash
git fetch --all --prune
git checkout staging
git pull --ff-only origin staging
git checkout codex-version
git pull --ff-only origin codex-version

git branch backup/staging-20260305 origin/staging
git branch backup/codex-version-20260305 origin/codex-version
```

Checkpoint esperado:
- Sin conflictos.
- Backups creados localmente.

### Fase 1 - Rama de integracion controlada

```bash
git checkout -b codex/staging-align-20260305 origin/staging
git merge --no-ff origin/codex-version -m "merge: align codex-version into staging (2026-03-05)"
```

Si hay conflictos:
- Resolver manualmente preservando fixes de staging en seguridad/deploy.
- Re-ejecutar pruebas antes de push.

### Fase 2 - Gates obligatorios

```bash
npm ci
npm run scan:secrets
npm run lint
npm run test:smoke
npm run test -- --run
npm run verify:staging-target
```

Gate de salida:
- `scan:secrets` OK
- `test:smoke` OK
- `verify:staging-target` OK
- Unit tests: OK o baseline conocido documentado

### Fase 3 - Validacion funcional de staging

Validar en `portal-staging`:
- Login exitoso.
- Dashboard con selector de fechas:
  - `Este Mes` puede mostrar 0 si no hay leads creados en el mes actual.
  - `Mes Pasado` debe reflejar los leads historicos esperados.
- Pipeline carga deals y permite navegacion sin errores 4xx/5xx internos.
- Edge functions criticas en estado operativo segun runbook vigente.

### Fase 4 - Promocion y alineacion remota

```bash
git push -u origin codex/staging-align-20260305
```

Abrir PR: `codex/staging-align-20260305` -> `staging`  
Tras merge del PR:

```bash
git fetch --all --prune
git checkout codex-version
git merge --ff-only origin/staging
git push origin codex-version
```

Resultado esperado:
- `origin/staging` y `origin/codex-version` apuntan al mismo SHA.

### Fase 5 - Alineacion local 100%

```bash
git fetch --all --prune
git checkout staging
git merge --ff-only origin/staging
git checkout codex-version
git merge --ff-only origin/codex-version
```

Verificacion final:

```bash
git rev-list --left-right --count origin/staging...origin/codex-version
git rev-parse staging codex-version origin/staging origin/codex-version
```

Esperado:
- Divergencia `0 0`.
- Los cuatro refs con el mismo SHA.

## 4) Criterios de rollback

Rollback tecnico inmediato si:
- Falla `scan:secrets` o `test:smoke`.
- Error de autenticacion/API key en staging post-merge.
- Regresion en dashboard/pipeline (sin datos en rangos que si tienen datos).

Procedimiento:
- Revert del merge commit en `staging`.
- Restaurar desde `backup/staging-20260305` si fuera necesario.

## 5) Evidencia minima a guardar

- SHA antes/despues de `staging` y `codex-version`.
- Output de gates (`scan:secrets`, `test:smoke`, `verify:staging-target`).
- Captura funcional de dashboard (filtro `Mes Pasado`) y pipeline.
