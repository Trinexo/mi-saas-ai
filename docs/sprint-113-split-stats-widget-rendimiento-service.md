# Sprint 113 – Split statsWidgetRendimiento.service

## Fecha
2026-04-08

## Objetivo
Dividir `statsWidgetRendimiento.service.js` por enfoque de métricas (eficiencia y calidad), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `statsWidgetRendimientoEficiencia.service.js` | Nuevo | Métricas de ritmo, eficiencia y rendimiento por modo |
| `statsWidgetRendimientoCalidad.service.js` | Nuevo | Métricas de precisión, insight mensual y temas débiles |
| `statsWidgetRendimiento.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `statsWidgetRendimientoEficiencia.service.js`
- `getRitmoPregunta`
- `getEficienciaTiempo`
- `getRendimientoModos`

### `statsWidgetRendimientoCalidad.service.js`
- `getBalancePrecision`
- `getInsightMensual`
- `getTemasDebiles`

## Barrel de compatibilidad

```js
import { statsWidgetRendimientoEficienciaService } from './statsWidgetRendimientoEficiencia.service.js';
import { statsWidgetRendimientoCalidadService } from './statsWidgetRendimientoCalidad.service.js';

export const statsWidgetRendimientoService = {
  ...statsWidgetRendimientoEficienciaService,
  ...statsWidgetRendimientoCalidadService,
};

export { statsWidgetRendimientoEficienciaService, statsWidgetRendimientoCalidadService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
