---
name: ui-branding-tailwind
description: Aplica branding UI usando Tailwind (tokens de color, tipografía, layout, estados y accesibilidad). Úsalo cuando el usuario pida "aplicar estilos de una imagen", "ajustar diseño", "poner colores corporativos", "usar logo", o "unificar look & feel" en pantallas del proyecto.
---

# UI Branding Tailwind Skill

## Goal
Aplicar un rediseño visual consistente (Tailwind) a una o más pantallas, basándome en referencias (capturas) y en tokens de marca (colores/logo), sin alterar lógica de negocio.

## Inputs esperados
- Capturas: (1) estilo deseado, (2) estado actual, (3) logo si aplica.
- Tokens: paleta (hex), naming requerido.
- Alcance: qué pantallas/rutas/componentes tocar.

## Instrucciones
1) **Localiza la UI real**
   - Encuentra el componente/route exacto que renderiza la pantalla objetivo.
   - No cambies servicios, auth, rutas, ni lógica: solo markup + estilos.

2) **Tokeniza primero**
   - Implementa tokens en `tailwind.config.*` (theme.extend.colors) si existe Tailwind.
   - Si los nombres pedidos no son válidos, crea alias y documenta el mapping en un comentario.

3) **Implementa layout**
   - Replica estructura visual (grid/card/spacing) desde la referencia “deseada”.
   - Aplica colores usando tokens (no hardcodear hex en clases salvo excepción).
   - Define estados hover/active/focus/disabled.

4) **Accesibilidad**
   - Labels conectados, focus visible, contraste razonable, navegación por teclado.

5) **Entregables**
   - Produce un diff/patch.
   - Lista comandos de verificación (lint/test/build) según package.json.
   - Si es posible, screenshot o pasos para obtenerlo localmente.

## Constraints (no negociables)
- No agregar librerías nuevas sin necesidad.
- No romper rutas, auth, ni contratos de API.
- No ejecutar comandos destructivos.
- No introducir nuevos componentes “globales” sin razón; prioriza cambios locales y reutilización existente.

## Ejemplos
- “Aplica estos colores corporativos y el logo a la pantalla de login para que se parezca a esta captura”
- “Unifica el estilo de formularios (inputs, botones, focus ring) con la paleta de marca”
