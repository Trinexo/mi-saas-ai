# Sprint 49 — Split stats.repository.js en widgetStats y progressStats

## Resumen

Refactorización del repositorio de estadísticas backend: `stats.repository.js` (1187 líneas) dividido en dos archivos especializados. El archivo original queda como barrel de compatibilidad (11 líneas).

## Motivación

`stats.repository.js` acumulaba 27 métodos async mezclando dos dominios distintos:
- Queries de widgets del dashboard de inicio
- Queries de progreso para páginas interiores

Con 1187 líneas era el archivo más grande del backend y dificultaba la localización de código y el mantenimiento.

## Cambios

### Archivos creados

#### `backend/src/repositories/widgetStats.repository.js`
- **Propósito**: Queries exclusivas de los widgets del dashboard principal
- **Líneas**: ~290
- **Helpers**: `DAY_IN_MS`, `toDayIndex`, `calcBestStreak`, `calcCurrentStreak`
- **Métodos** (15):
  - `getConsistenciaDiaria`
  - `getRitmoPregunta`
  - `getBalancePrecision`
  - `getEficienciaTiempo`
  - `getProgresoSemanal`
  - `getRendimientoModos`
  - `getInsightMensual`
  - `getTemasDebiles`
  - `getActividad14Dias`
  - `getResumenSemana`
  - `getFocoHoy`
  - `getGamificacion`
  - `getObjetivoDiario`
  - `getRacha`
  - `getRachaTemas`

#### `backend/src/repositories/progressStats.repository.js`
- **Propósito**: Queries de progreso para páginas interiores (ProgressPage, OposicionPage, TemaPage, MisOposicionesPage)
- **Líneas**: ~530
- **Métodos** (12):
  - `getProgresoTemas`
  - `getUserStats`
  - `getTemaStats`
  - `getRepasoStats`
  - `getDashboard`
  - `getSimulacrosStats`
  - `getEvolucion`
  - `getResumenOposicion`
  - `getProgresoTemasByMateria`
  - `getDetalleTema`
  - `getProgresoMaterias`
  - `getMisOposiciones`

### Archivos modificados

#### `backend/src/repositories/stats.repository.js` → barrel (11 líneas)
Re-exporta ambos repositorios y fusiona sus métodos en `statsRepository` para mantener compatibilidad con tests e importadores existentes:

```js
import { widgetStatsRepository } from './widgetStats.repository.js';
import { progressStatsRepository } from './progressStats.repository.js';

export const statsRepository = {
  ...widgetStatsRepository,
  ...progressStatsRepository,
};

export { widgetStatsRepository, progressStatsRepository };
```

#### `backend/src/services/stats.service.js`
- Importa `widgetStatsRepository` y `progressStatsRepository` directamente
- Cada método del servicio llama al sub-repositorio correcto
- Lógica de validación (`ApiError`) sin cambios

## Métricas

| Archivo | Antes | Después |
|---|---|---|
| `stats.repository.js` | 1187 líneas | 11 líneas (barrel) |
| `widgetStats.repository.js` | — | ~290 líneas |
| `progressStats.repository.js` | — | ~530 líneas |

## Compatibilidad

- **Tests existentes**: No requieren cambios. Siguen importando `{ statsRepository }` desde `stats.repository.js` y todos los métodos siguen disponibles via spread.
- **Otros importadores**: El barrel garantiza compatibilidad total hacia atrás.
- **Nuevos consumidores**: Pueden importar directamente `widgetStatsRepository` o `progressStatsRepository` según dominio.

## CI

- `build-frontend`: ✅ pass
- `test-backend`: ✅ pass (4/4 checks)

## PR

- Código: #155 — `refactor(backend): dividir stats.repository.js en widgetStats y progressStats`
- Docs: #156 (este PR)
