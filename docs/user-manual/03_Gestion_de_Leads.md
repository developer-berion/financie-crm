# 03 — Gestión Avanzada de Leads

La gestión de leads en Financie CRM va más allá de un simple listado. Es un entorno dinámico diseñado para asegurar la calidad del dato y la eficiencia en el contacto.

## Listado de Leads
En el menú lateral encontrarás el acceso a **Leads**. Esta vista te permite:
- **Filtrado Avanzado:** Filtra por fuente (Meta, Calendly, Manual), etapa, agente asignado o fecha de creación.
- **Búsqueda por Atributos:** Puedes buscar prospectos por nombre, teléfono o correo electrónico.
- **Exportación:** (Solo para roles con permiso) Permite descargar la data para análisis externo.

## Vista Detallada Dinámica
Cuando abres un lead específico, la pantalla se adapta a la etapa en la que se encuentra.
- **Etapa Temprana (Nuevo/Contactado):** Verás campos de biografía, origen del prospecto y notas de descubrimiento.
- **Etapa Media (Propuesta):** Verás campos técnicos de la póliza, propuesta comercial y archivos adjuntos.
- `[FACT]` Los campos críticos (Nombre, Monto, Prioridad) están fijados en un encabezado superior para que nunca los pierdas de vista al hacer scroll.

## Motor Anti-Duplicados
`[FACT]` El sistema evita que dos agentes contacten a la misma persona o que la data se fragmente.
- **Matching Exacto:** El sistema bloquea la creación si detecta un correo o teléfono ya existente.
- **Matching Difuso (Fuzzy):** Te avisará si hay nombres similares en la misma ciudad o empresa.

### Resolución de Conflictos (Compare & Merge)
Si se encuentra un potencial duplicado, el sistema te ofrecerá una interfaz de comparación lado a lado.
> [!IMPORTANT]
> Podrás elegir para cada campo (Nombre, Teléfono, Correo) qué dato quieres conservar como el "Sobreviviente". Una vez fusionados, la acción se registra en el log de auditoría.

## Indicador de Integridad de Datos
`[FACT]` Cada lead tiene un indicador visual de calidad.
- **Verde:** Datos completos y verificados.
- **Amarillo:** Faltan campos no mandatorios (ej: fecha de nacimiento).
- **Rojo:** Información inconsistente o incompleta para la etapa actual.

---
### Field Card: Origen del Lead (Lead Source)
- **Etiqueta:** `Fuente`
- **Tipos Permitidos:** Meta Ads, Calendly, Landing Page, Manual.
- **Propósito:** Atribución de marketing para calcular el ROI de las campañas.
- **Origen:** Automático (vía Webhook) o Manual.
