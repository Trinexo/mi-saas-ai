# Sprint 53 — Split stats.controller.js en statsRendimiento y statsProgreso

## Resumen

Refactorización del controlador de estadísticas backend: `stats.controller.js` (255 líneas, 26 handlers) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (3 líneas).

## Motivación

`stats.controller.js` mezclaba dos dominios distintos:
- Métricas de rendimiento y actividad personal del usuario (consistencia, ritmo, gamificación, evolución, racha)
- Progreso estructural por temario y oposición (temas débiles, materias, simulacros, detalle de tema)

## Cambios

### Archivos creados

#### `backend/src/controllers/statsRendimiento.controller.js`
- **Propósito**: Handlers de métricas de rendimiento y actividad personal
- **Líneas**: ~155
- **Imports**: `ok`, `statsService`
- **Handlers** (17):
  - `getConsistenciaDiaria`
  - `getRitmoPregunta`
  - `getBalancePrecision`
  - `getEficienciaTiempo`
  - `getProgresoSemanal`
  - `getRendimientoModos`
  - `getInsightMensual`
  - `getActividad14Dias`
  - `getResumenSemana`
  - `getFocoHoy`
  - `getGamificacion`
  - `getObjetivoDiario`
  - `getDashboard`
  - `getUserStats`
  - `getEvolucion`
  - `getRacha`
  - `getRachaTemas`

#### `backend/src/controllers/statsProgreso.controller.js`
- **Propósito**: Handlers de progreso por temario y oposición
- **Líneas**: ~102
- **Imports**: `ok`, `statsService`, `ApiError`
- **Handlers** (10):
  - `getTemasDebiles`
  - `getProgresoTemas`
  - `getTemaStats`
  - `getRepasoStats`
  - `getSimulacrosStats`
  - `getResumenOposicion` (valida `oposicion_id` requerido)
  - `getProgresoMaterias` (valida `oposicion_id` requerido)
  - `getProgresoTemasByMateria` (valida `materia_id` requerido)
  - `getDetalleTema` (valida `id` requerido)
  - `getMisOposiciones`

### Archivos modificados

#### `backend/src/controllers/stats.controller.js` → barrel (3 líneas)
Re-exporta todas las funciones de ambos sub-controladores con `export *`:

```js
// Barrel de compatibilidad — los handlers se han dividido en statsRendimiento y statsProgreso.
export * from './statsRendimiento.controller.js';
export * from './statsProgreso.controller.js';
```

#### `backend/src/routes/v1/stats.routes.js` — sin cambios
El router importa por nombre desde `stats.controller.js`. El barrel con `export *` mantiene todos los exports nombrados disponibles.

## Métricas

| Archivo | Antes | Después |
|---|---|---|
| `stats.controller.js` | 255 líneas | 3 líneas (barrel) |
| `statsRendimiento.controller.js` | — | ~155 líneas |
| `statsProgreso.controller.js` | — | ~102 líneas |

## Compatibilidad

- **`stats.routes.js`**: Sin cambios. Importa 26 funciones por nombre del barrel.
- **Tests**: Sin tests que importen el controlador directamente — sin impacto.
- **Nuevos consumidores**: Pueden importar `statsRendimiento.controller.js` o `statsProgreso.controller.js` por separado.

## CI

- `build-frontend`: ✅ pass (~13s)
- `test-backend`: ✅ pass (~60s, 4/4 checks)

## PR

- Código: #163 — `refactor(backend): dividir stats.controller.js en statsRendimiento y statsProgreso`
- Docs: #164 (este PR)
