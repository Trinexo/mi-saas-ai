# Sprint 62 – Split statsRendimiento.controller.js

## Resumen

Se dividió `statsRendimiento.controller.js` (155 líneas, 17 handlers) en dos sub-archivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos resultantes

### `statsRendimientoMetricas.controller.js` (66 líneas, 8 handlers)

| Handler | Descripción |
|---|---|
| `getConsistenciaDiaria` | Consistencia diaria del usuario |
| `getRitmoPregunta` | Ritmo de preguntas respondidas |
| `getBalancePrecision` | Balance de precisión |
| `getEficienciaTiempo` | Eficiencia temporal |
| `getProgresoSemanal` | Progreso semanal |
| `getRendimientoModos` | Rendimiento por modos de test |
| `getInsightMensual` | Insight mensual |
| `getActividad14Dias` | Actividad de los últimos 14 días |

### `statsRendimientoResumen.controller.js` (74 líneas, 9 handlers)

| Handler | Descripción |
|---|---|
| `getResumenSemana` | Resumen de la semana |
| `getFocoHoy` | Foco de estudio de hoy |
| `getGamificacion` | Datos de gamificación |
| `getObjetivoDiario` | Objetivo diario |
| `getDashboard` | Dashboard completo |
| `getUserStats` | Estadísticas generales del usuario |
| `getEvolucion` | Evolución histórica |
| `getRacha` | Racha de estudio |
| `getRachaTemas` | Racha por temas |

### `statsRendimiento.controller.js` (3 líneas – barrel de compatibilidad)

Re-exporta ambos sub-archivos con `export *`.

## Impacto

- **Barrel superior** `stats.controller.js` no requiere cambios.
- **Build**: sin cambios en tamaño (327.31 kB).
- **CI**: 4/4 checks passed.

## PRs

- Código: #181
- Documentación: #182
