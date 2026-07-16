# Sprint 69 — widgetEngagement.repository.js split

## Resumen

División de `widgetEngagement.repository.js` (310 líneas, 6 métodos) en dos archivos especializados con barrel de compatibilidad.

## Archivos modificados

### Nuevos

- **`widgetEngagementFoco.repository.js`** — Métodos de foco y objetivos de usuario:
  - `getTemasDebiles` — temas con menor porcentaje de acierto
  - `getFocoHoy` — recomendación de sesión para hoy
  - `getObjetivoDiario` — seguimiento del objetivo diario de preguntas

- **`widgetEngagementRacha.repository.js`** — Métodos de racha y gamificación (incluye helpers locales `toDayIndex`, `calcBestStreak`, `calcCurrentStreak`):
  - `getGamificacion` — XP, nivel y progreso del usuario
  - `getRacha` — racha actual, mejor racha y actividad de los últimos 7 días
  - `getRachaTemas` — racha desglosada por tema

### Convertidos a barrel

- **`widgetEngagement.repository.js`** — Barrel de compatibilidad. Re-exporta `widgetEngagementRepository` como unión de ambos sub-repositorios. Sin cambios en el importador (`widgetStats.repository.js`).

## Verificación

- Build frontend: **327.31 kB** ✅
- CI: 4/4 checks pasados ✅
- PR código: #195 mergeado (`2026-04-07T07:54:27Z`)
