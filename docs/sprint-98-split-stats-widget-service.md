# Sprint 98 – Split statsWidget.service

## Fecha
2026-04-08

## Objetivo
Dividir `statsWidget.service.js` en dos sub-servicios por dominio (rendimiento y engagement), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `statsWidgetRendimiento.service.js` | Nuevo | Métricas de rendimiento y precisión |
| `statsWidgetEngagement.service.js` | Nuevo | Métricas de consistencia, foco y racha |
| `statsWidget.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `statsWidgetRendimiento.service.js`
- `getRitmoPregunta`
- `getBalancePrecision`
- `getEficienciaTiempo`
- `getRendimientoModos`
- `getInsightMensual`
- `getTemasDebiles`

### `statsWidgetEngagement.service.js`
- `getConsistenciaDiaria`
- `getProgresoSemanal`
- `getActividad14Dias`
- `getResumenSemana`
- `getFocoHoy`
- `getGamificacion`
- `getObjetivoDiario`
- `getRacha`
- `getRachaTemas`

## Barrel de compatibilidad

```js
import { statsWidgetRendimientoService } from './statsWidgetRendimiento.service.js';
import { statsWidgetEngagementService } from './statsWidgetEngagement.service.js';

export const statsWidgetService = {
  ...statsWidgetRendimientoService,
  ...statsWidgetEngagementService,
};

export { statsWidgetRendimientoService, statsWidgetEngagementService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #252 mergeado
