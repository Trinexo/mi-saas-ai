# Release Notes — Sprint 64: stats.service.js split

## Descripción

División de `stats.service.js` (139 líneas, 22 métodos) en dos sub-servicios focalizados por repositorio delegado.

## Archivos modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `backend/src/services/stats.service.js` | Barrel | 139 → 6 líneas |
| `backend/src/services/statsWidget.service.js` | Nuevo | 15 métodos de widgets |
| `backend/src/services/statsProgreso.service.js` | Nuevo | 12 métodos de progreso |

## Criterio de división

| Sub-servicio | Repositorio | Métodos | Validaciones |
|---|---|---|---|
| `statsWidgetService` | `widgetStatsRepository` | 15 | No |
| `statsProgresoService` | `progressStatsRepository` | 12 | Sí (ApiError) |

### Métodos en `statsWidget.service.js`
- `getConsistenciaDiaria`, `getRitmoPregunta`, `getBalancePrecision`, `getEficienciaTiempo`
- `getProgresoSemanal`, `getRendimientoModos`, `getInsightMensual`, `getTemasDebiles`
- `getActividad14Dias`, `getResumenSemana`, `getFocoHoy`, `getGamificacion`
- `getObjetivoDiario`, `getRacha`, `getRachaTemas`

### Métodos en `statsProgreso.service.js`
- `getProgresoTemas`, `getDashboard`, `getUserStats`, `getEvolucion`, `getMisOposiciones`
- `getTemaStats`, `getRepasoStats` — validan `temaId` entero positivo
- `getSimulacrosStats`, `getResumenOposicion`, `getProgresoMaterias` — validan `oposicionId` entero positivo
- `getProgresoTemasByMateria` — valida `materiaId` entero positivo
- `getDetalleTema` — valida `temaId` + lanza 404 si no existe

## Barrel de compatibilidad

```js
// stats.service.js
import { statsWidgetService } from './statsWidget.service.js';
import { statsProgresoService } from './statsProgreso.service.js';

export const statsService = { ...statsWidgetService, ...statsProgresoService };
export { statsWidgetService, statsProgresoService };
```

Los tres controllers que importaban `statsService` no requieren cambios.

## Verificación

- Build frontend: **327.31 kB** ✅
- CI: build-frontend ✅, test-backend ✅
- PR #185 mergeado en main
