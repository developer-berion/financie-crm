# Notion Workflow Standard 2026

## Objetivo
Estandarizar la ejecucion de tickets en Notion para asegurar trazabilidad, calidad de entrega y control de riesgo tecnico/operativo.

## Motivo
El proyecto migro a Notion como fuente unica de trabajo. Sin una politica comun:
- se pierden decisiones y contexto tecnico;
- se despliegan cambios sin gates de staging;
- se cierran tickets sin evidencia verificable;
- aumenta el riesgo de regresiones y fallos en produccion.

Este flujo elimina ambiguedad y define criterios minimos por estado.

## Alcance
- Tablero: `Financie CRM - Tareas y Ejecucion 2026`.
- Todas las tareas y subtareas tecnicas, de producto y operacion.
- Flujo completo: ideacion, desarrollo, QA, staging, produccion y cierre.

## Estados Oficiales
1. `backlog`
2. `ready for dev`
3. `in progress`
4. `in review`
5. `qa / testing`
6. `staging / uat`
7. `ready to deploy`
8. `done`
9. `blocked`

## Regla de Rama y Deploy
1. Todo cambio inicia en `codex-version`.
2. Primer despliegue siempre en `staging` (DB staging + Vercel staging).
3. Produccion solo al final, despues de pruebas y documentacion completa.

## Campos Minimos de Ticket (Definition of Ready)
Un ticket no puede pasar a `ready for dev` sin:
1. Objetivo.
2. Motivo.
3. Impacto esperado.
4. Resultado esperado.
5. Beneficios.
6. Modulos afectados.
7. Sistemas afectados.
8. Dependencias.
9. Riesgos.
10. Plan de pruebas.
11. Plan de rollback.

## Criterios por Estado
### `ready for dev`
- Campos minimos completos.
- Alcance y dependencias claras.

### `in progress`
- Rama objetivo definida (`codex-version`).
- Owner tecnico asignado.
- Plan de ejecucion inicial en el ticket.

### `in review`
- Cambios implementados.
- Evidencia tecnica preliminar (commits, archivos, notas de prueba).

### `qa / testing`
- Pruebas locales ejecutadas.
- Casos criticos verificados.
- Riesgos residuales documentados.

### `staging / uat`
- `Staging DB OK` marcado.
- `Staging Vercel OK` marcado.
- Validacion funcional en entorno staging.

### `ready to deploy`
- `QA OK` marcado.
- `Docs OK` marcado.
- `Prod impacto revisado` marcado.
- Rollback listo y explicito.

### `done`
- Deploy productivo ejecutado.
- Verificacion post-deploy completada.
- Evidencia final cargada en ticket.

### `blocked`
- Causa concreta.
- Owner del desbloqueo.
- ETA de resolucion o decision ejecutiva.

## Proceso de Actualizacion de Ticket
Actualizar estado y nota en estos hitos:
1. Inicio de trabajo.
2. Fin de implementacion.
3. Resultado de QA.
4. Resultado de staging/UAT.
5. Paso a produccion.
6. Cierre con impacto real observado.

## Checklist de Cierre (Definition of Done)
1. Merge en rama objetivo.
2. Validacion DB staging.
3. Validacion Vercel staging.
4. Documentacion actualizada.
5. Impacto real vs esperado registrado.
6. Evidencia tecnica adjunta.
7. Rollback verificado o ejecutable.

## Excepciones
No se permite salto directo `backlog -> done`.
No se permite deploy productivo sin paso por `staging / uat`.
No se permite cierre sin evidencia.
