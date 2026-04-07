# Release Notes — Sprint 68: widgetRendimiento.repository.js split

## Descripción

División de `widgetRendimiento.repository.js` (403 líneas, 8 métodos) en dos repositorios separados por dominio funcional.

## Archivos modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `backend/src/repositories/widgetRendimiento.repository.js` | Barrel | 403 → 6 líneas |
| `backend/src/repositories/widgetRendimientoActividad.repository.js` | Nuevo | 4 métodos de actividad |
| `backend/src/repositories/widgetRendimientoMetricas.repository.js` | Nuevo | 5 métodos de métricas |

## Criterio de división

| Sub-repositorio | Dominio | Métodos |
|---|---|---|
| `widgetRendimientoActividadRepository` | Actividad y timeline del usuario | `getConsistenciaDiaria`, `getProgresoSemanal`, `getActividad14Dias`, `getResumenSemana` |
| `widgetRendimientoMetricasRepository` | Métricas de rendimiento y precisión | `getRitmoPregunta`, `getBalancePrecision`, `getEficienciaTiempo`, `getRendimientoModos`, `getInsightMensual` |

## Barrel de compatibilidad

```js
// widgetRendimiento.repository.js
import { widgetRendimientoActividadRepository } from './widgetRendimientoActividad.repository.js';
import { widgetRendimientoMetricasRepository } from './widgetRendimientoMetricas.repository.js';

export const widgetRendimientoRepository = { ...widgetRendimientoActividadRepository, ...widgetRendimientoMetricasRepository };
export { widgetRendimientoActividadRepository, widgetRendimientoMetricasRepository };
```

El barrel `widgetStats.repository.js` no requiere cambios.

## Verificación

- Build frontend: **327.31 kB** ✅
- CI: 4/4 checks ✅
- PR #193 mergeado en main
