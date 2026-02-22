# 05 — Administración y Gobernanza

Este módulo está destinado a los administradores de la plataforma y personal de RevOps/Seguridad. Proporciona las herramientas necesarias para escalar la organización manteniendo el control total sobre los datos y las finanzas.

## Control de Acceso (RBAC)
`[FACT]` El CRM opera bajo el principio de "mínimo privilegio". Los accesos se definen mediante una matriz de roles y permisos.
- **Roles Estándar:**
    - **Admin:** Acceso total a configuración y auditoría.
    - **Manager:** Puede ver leads de su equipo y aprobar comisiones.
    - **Agent:** Solo ve sus propios leads y métricas personales.
- `[FACT]` Las restricciones se aplican a nivel de base de datos (Supabase RLS), asegurando que un agente no pueda consultar datos ajenos mediante herramientas externas.

## Registro de Auditoría (Audit Logs)
`[FACT]` Cada acción crítica es registrada en una tabla inmutable.
- **Eventos Auditados:** Inicios de sesión, exportación de datos, eliminación de registros, cambios en tasas de comisión.
- **Trazabilidad:** Verás el usuario, la acción, la fecha exacta y el "antes y después" de los datos modificados.
- `[INFERENCE]` El sistema permite cumplir con normativas internacionales de protección de datos (ej: GDPR / ISO) al tener pruebas de quién accedió a qué información.

## Calculadora de Comisiones
Automatiza el incentivo financiero de los agentes basándose en reglas transparentes.
- **Tipos de Reglas:**
    - Porcentaje fijo sobre el valor del trato.
    - Escalas (Tiers) por volumen de ventas.
    - Bonos fijos por lead calificado.
- **Flujo de Pago:**
    1. El trato se marca como **Ganado**.
    2. La comisión entra en estado **Pendiente**.
    3. Un Manager revisa y marca como **Aprobado**.
    4. El agente recibe una notificación instantánea.

## Gestión de Webhooks e Integraciones
En la sección de integraciones, puedes configurar cómo el CRM recibe leads de fuentes externas.
- **Facebook Lead Ads:** Conexión directa con tus campañas.
- **Calendly:** Sincronización de eventos de agenda.
- `[FACT]` Todas las integraciones utilizan firmas digitales (X-Hub-Signature-256) para asegurar que los datos provienen de fuentes confiables.

---
### Protocolo de Seguridad: "Least Privilege"
> [!CAUTION]
> Nunca compartas tu contraseña. El CRM registra todas las actividades bajo tu identidad. Las acciones de exportación masiva disparan una alerta de riesgo al Super Admin.

---
### Documentación de RBAC: Tabla de Permisos
| Acción | Agente | Manager | Admin |
|---|---|---|---|
| Ver Dashboard Global | No | Sí | Sí |
| Exportar Base de Leads | No | No | Sí |
| Aprobar Comisiones | No | Sí | Sí |
| Configurar Webhooks | No | No | Sí |
