# 01 — Dashboard de Inteligencia

El Dashboard es el cerebro del CRM. Su propósito es proporcionar una visión clara y accionable del estado de tu negocio, permitiéndote tomar decisiones basadas en datos y no en suposiciones.

## Componentes del Dashboard

### 1. Funnel de Ventas (Leakage Analysis)
Esta visualización muestra cómo fluyen tus prospectos a través de las etapas.
- **Métrica Clave:** Tasa de Conversión (CR).
- **Utilidad:** Identifica en qué etapa estás perdiendo más dinero. Si la "fuga" es alta en la etapa de *Propuesta*, quizás necesites ajustar tus precios o la forma de presentar el valor.
- `[FACT]` Los datos se basan en el historial real de movimientos de leads en la tabla `leads`.

### 2. Leaderboard de Eficiencia
El ranking de agentes no se basa solo en quién vende más, sino en quién es más eficiente.
- **Eficiencia = (Contratos Ganados / Leads Asignados) * 100**.
- `[FACT]` El sistema utiliza indicadores de tendencia (flechas verdes/rojas) para comparar tu rendimiento con el período anterior.

### 3. Pronóstico de Ingresos Ponderado (Forecast)
Proyecta cuánto dinero entrará en el próximo mes basándose en la probabilidad de cierre de cada etapa.
- **Probabilidad de Cierre (Configurada por Defecto):**
    - Nuevo: 5%
    - Contactado: 15%
    - Presentación: 40%
    - Propuesta: 70%
    - Negociación: 90%
- `[INFERENCE]` Si tienes $10,000 en etapa de *Propuesta*, el sistema proyecta $7,000 de ingreso esperado.

## Estados de Datos
> [!WARNING]
> Verás indicadores de estado en tus gráficas:
> - **Nominal:** Datos al día.
> - **Stale (Vencido):** Los datos tienen más de 1 hora sin actualizarse.
> - **Partial:** Algunos datos de agentes no están incluidos en el cálculo actual.

---
### KPI Card: Tasa de Conversión
- **Definición:** Porcentaje de leads que pasan de una etapa a la siguiente.
- **Owner:** Gerencia de Ventas (RevOps).
- **Fórmula:** `(Leads Etapa B / Leads Etapa A) * 100`.
- **Decisión Habilitada:** Dónde invertir tiempo en entrenamiento o mejora de procesos.
