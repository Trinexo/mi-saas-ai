# Sprint 54 — Split widgetStats.repository.js en widgetRendimiento y widgetEngagement

## Resumen

Refactorización del repositorio de widgets de estadísticas: `widgetStats.repository.js` (710 líneas, 15 métodos) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (10 líneas).

## Motivación

`widgetStats.repository.js` mezclaba dos dominios distintos en 710 líneas:
- Métricas de rendimiento y actividad temporal del usuario (consistencia, ritmo, balance, eficiencia, progreso semanal, actividad)
- Engagement, gamificación y rachas (temas débiles, foco del día, XP/nivel, objetivo diario, rachas)

Los helpers privados de cálculo de racha (`toDayIndex`, `calcBestStreak`, `calcCurrentStreak`) solo eran usados por los métodos de racha, por lo que migran junto a ellos.

## Cambios

### Archivos creados

#### `backend/src/repositories/widgetRendimiento.repository.js`
- **Propósito**: Consultas de métricas de rendimiento y actividad temporal del usuario
- **Líneas**: ~403
- **Imports**: `pool`
- **Métodos** (9):
  - `getConsistenciaDiaria` — actividad 30 días y tendencia
  - `getRitmoPregunta` — segundos por pregunta y tendencia
  - `getBalancePrecision` — distribución aciertos/errores/blancos (30 días)
  - `getEficienciaTiempo` — tiempo medio por test y aciertos por minuto
  - `getProgresoSemanal` — serie diaria 7 días con nota media
  - `getRendimientoModos` — rendimiento por tipo de test (30 días)
  - `getInsightMensual` — resumen 30 días con delta 7 días
  - `getActividad14Dias` — serie de actividad 14 días
  - `getResumenSemana` — totales rápidos de los últimos 7 días

#### `backend/src/repositories/widgetEngagement.repository.js`
- **Propósito**: Consultas de gamificación, foco y rachas
- **Líneas**: ~310
- **Helpers privados**: `DAY_IN_MS`, `toDayIndex`, `calcBestStreak`, `calcCurrentStreak`
- **Imports**: `pool`
- **Métodos** (6):
  - `getTemasDebiles` — top 3 temas con peor % de acierto (mín. 5 respuestas)
  - `getFocoHoy` — sugerencia del día (repaso espaciado > refuerzo > adaptativo)
  - `getGamificacion` — XP total, nivel actual y progreso de nivel
  - `getObjetivoDiario` — cumplimiento del objetivo diario de preguntas
  - `getRacha` — racha actual, mejor racha y actividad 7 días
  - `getRachaTemas` — racha de estudio por tema agrupada

### Archivos modificados

#### `backend/src/repositories/widgetStats.repository.js` → barrel (10 líneas)
Fusiona ambos repositorios en `widgetStatsRepository` para compatibilidad total:

```js
// Barrel de compatibilidad - los metodos se han dividido en widgetRendimiento y widgetEngagement.
import { widgetRendimientoRepository } from './widgetRendimiento.repository.js';
import { widgetEngagementRepository } from './widgetEngagement.repository.js';

export const widgetStatsRepository = {
  ...widgetRendimientoRepository,
  ...widgetEngagementRepository,
};

export { widgetRendimientoRepository, widgetEngagementRepository };
```

#### `backend/src/services/stats.service.js` — sin cambios
#### `backend/src/repositories/stats.repository.js` — sin cambios (barrel de nivel superior)

## Métricas

| Archivo | Antes | Después |
|---|---|---|
| `widgetStats.repository.js` | 710 líneas | 10 líneas (barrel) |
| `widgetRendimiento.repository.js` | — | ~403 líneas |
| `widgetEngagement.repository.js` | — | ~310 líneas |

## Compatibilidad

- **`stats.service.js`**: Sin cambios. Importa `widgetStatsRepository` del barrel.
- **`stats.repository.js`**: Sin cambios. Importa `widgetStatsRepository` del barrel y lo extiende en su propio barrel de nivel superior.
- **Nuevos consumidores**: Pueden importar `widgetRendimientoRepository` o `widgetEngagementRepository` por separado.

## CI

- `build-frontend`: ✅ pass (~13s)
- `test-backend`: ✅ pass (~60s, 4/4 checks)

## PR

- Código: #165 — `refactor(backend): dividir widgetStats.repository.js en widgetRendimiento y widgetEngagement`
- Docs: #166 (este PR)
