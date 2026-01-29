
## 2026-01-29
- **Hecho:**
    - Se eliminó la duplicidad de llamadas (conflicto Cron vs Trigger).
    - Optimización "Speed to Lead": Delay reducido de 5 min a 1 min.
    - Lógica de Reintentos: 3 intentos c/5 min para jobs fallidos.
    - Dashboard: Ahora consume de `jobs` (fuente real).
    - Limpieza: Eliminado job `twilio-dispatcher` obsoleto.
- **Bloqueos:**
    - Verificación automática de fallo saltó por constraint FK (esperado), validado vía código.
- **Próximo:**
    - Monitorear tasa de contacto con nuevo delay.
