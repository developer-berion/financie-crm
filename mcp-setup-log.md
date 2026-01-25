# MCP Setup Log

## 1. Diagnóstico Inicial
## 1. Diagnóstico Inicial
*Iniciando comprobaciones...*

Resultados:
- **OS**: Windows (PowerShell 5.1 detectable)
- **Python**: 3.13.5 (OK)
- **uv/uvx**: No instalado (Requiere instalación)
- **elevenlabs-mcp**: No instalado
- **Config Dir**: Existe (`%USERPROFILE%\.gemini\antigravity\`)

Diagnóstico completado. Se requiere proceder con la instalación de `uv`.

## 2. Instalación de uv y Prueba
*Instalando uv...*
`pip install --user uv` -> ÉXITO.
`uvx` location: `C:\Users\victo\AppData\Roaming\Python\Python313\Scripts\uvx.exe`

*Probando ejecución...*
`uvx elevenlabs-mcp --help` -> Ejecutado.
Resultado: `ValueError: ELEVENLABS_API_KEY environment variable is required`.
Interpretación: El paquete se descargó e instaló correctamente, y la ejecución llegó al código del servidor. El error es esperado al no pasar la API key.

**Conclusión del Paso 2**: `uv` funciona. Usaremos la ruta absoluta en la configuración.

## 4. Configuración MCP
*Creando archivo de configuración...*
Ruta: `%USERPROFILE%\.gemini\antigravity\mcp_config.json`
Contenido generado (apuntando a `uvx` absoluto y ENV VAR passthrough):
```json
{
  "mcpServers": {
    "ElevenLabs": {
      "command": "C:\\Users\\victo\\AppData\\Roaming\\Python\\Python313\\Scripts\\uvx.exe",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "${ELEVENLABS_API_KEY}"
      }
    }
  }
}
```
Escritura exitosa vía PowerShell.

## 5. Verificación
**Intento 1**: Fallido.
Causa: Error de sintaxis PowerShell al generar el JSON; la variable `${ELEVENLABS_API_KEY}` se expandió a vacío.
Acción: Corregido `mcp_config.json` usando 'single quotes' para preservar la sintaxis literal `${...}` requerido por Antigravity.

**Intento 2**: Fallido.
Causa: La variable de entorno `ELEVENLABS_API_KEY` **NO existe** en el sistema (verificado vía comando `dir env:`).
Consecuencia: El servidor MCP inicia pero falla inmediatamente por falta de credenciales.

**ACCIÓN REQUERIDA (Manual)**:
Dado que la variable no está en el entorno global, se requiere que el usuario:
1. Abra el archivo `C:\Users\victo\.gemini\antigravity\mcp_config.json`.
2. Reemplace `"${ELEVENLABS_API_KEY}"` por su **API Key real** (entre comillas).
3. Guarde y reinicie Antigravity.

**Intento 3 (Diagnóstico Avanzado)**: Fallido (protocolo).
Observación: `uvx` genera output en stdout ("Installing...") que rompe el protocolo JSON-RPC de MCP.
Acción correctiva:
1. Instalado `elevenlabs-mcp` vía pip en Python global.
2. Parcheado `mcp_config.json` para usar `python -m elevenlabs_mcp` (directo, silencioso) en lugar de `uvx`.

**Intento 4**: Fallido (posible PATH).
Acción: Se actualizó `mcp_config.json` para usar la ruta absoluta de Python: `C:\Python313\python.exe`.

**Intento 5**: Fallido.
Causa: UTF-8 BOM generado por PowerShell. Se limpió.

**Intento 6 (Bypass)**: Fallido (Persistencia).
Acción: Se modificó `mcp_config.json` para pasar la API KEY directamente como argumento `--api-key` en lugar de variable de entorno. Resultado: El comando `python -m elevenlabs_mcp` intenta correr el INSTALADOR (`__main__.py`) y pide config path, fallando.

**Intento 7 (Submódulo Server - Definitivo)**:
Diagnóstico: El entry point por defecto del paquete es un instalador CLI. El servidor real está en `elevenlabs_mcp.server`.
Acción:
1. Se reescribió la config apuntando a: `args: ["-m", "elevenlabs_mcp.server"]`.
2. Se restauró la API Key a la variable de entorno `env: { "ELEVENLABS_API_KEY": "..." }` (ya que el módulo server la exige allí).
3. Encoding verificado.

**Intento 8 (VERIFICACIÓN FINAL)**:
Estado: **ÉXITO TOTAL**.
Prueba ejecutada: `list_models` (Lista modelos de ElevenLabs).
Resultado: Respuesta JSON válida recibida con lista de modelos (Eleven v3, Turbo v2.5, etc.).

**Conclusión**:
El servidor MCP de ElevenLabs está instalado, configurado y conectado correctamente usando el submódulo `elevenlabs_mcp.server`, con la API Key inyectada vía variable de entorno en el archivo de configuración.

Fin del proceso.











