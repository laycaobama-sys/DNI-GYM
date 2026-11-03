# DNI GYM — Sistema de diseño

Fuerza · disciplina · rendimiento · evolución · tecnología.

## Color (tokens en `src/app/globals.css`)

| Token | Valor | Uso |
|---|---|---|
| `bg` | #070708 | negro profundo, fondo |
| `surface` / `surface-2` / `surface-3` | #101113 / #16181b / #1d2024 | gris grafito, tarjetas |
| `line` / `line-strong` | #25282d / #33373e | bordes |
| `ink` / `ink-2` / `muted` | #f4f4f5 / #b9bcc2 / #80858d | texto |
| `accent` | #ff6b1a | **naranja solar**: acción principal, datos clave |
| `accent-ink` | #1a0a00 | texto sobre naranja |
| `good` / `warning` / `critical` | #3ddc84 / #ffb020 / #ff5a5f | estados (siempre con icono o texto) |
| `protein` / `carbs` / `fat` | #3a96dc / #bf8700 / #d0478c | macros (paleta validada para daltonismo) |

## Tipografía

- **Barlow Condensed** 700–800 itálica, mayúsculas: titulares atléticos (`font-athletic`).
- **Outfit** 500–800: títulos de interfaz (`font-display`).
- **Inter**: texto y datos (`tabular-nums` en cifras).

## Componentes

`src/components/ui.tsx`: Button, LinkButton, Card, CardHeader, Badge, Stat, Field, Modal (hoja inferior en móvil), Tabs, Progress, Spinner, PageHeader, EmptyState.
Radios: 12 px controles, 16–24 px tarjetas. Movimiento: 150–600 ms, respeta `prefers-reduced-motion`.

## Responsive

| Ancho | Navegación |
|---|---|
| 360–767 | barra inferior (Inicio · Explorar · Entrenar · Nutrición · Progreso), botón Volver en la barra superior |
| 768–1023 | barra inferior + contenido en 2 columnas |
| ≥1024 | sidebar permanente, dashboard multicolumna |

Se verifica sin desbordamiento horizontal en 360, 375, 390, 430, 768, 1024, 1280, 1440 y 1920 px.
