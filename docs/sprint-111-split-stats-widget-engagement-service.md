# Sprint 111 – Split statsWidgetEngagement.service

## Fecha
2026-04-08

## Objetivo
Dividir `statsWidgetEngagement.service.js` por tipo de métrica (actividad y hábitos), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `statsWidgetEngagementActividad.service.js` | Nuevo | Métricas de actividad diaria/semanal |
| `statsWidgetEngagementHabitos.service.js` | Nuevo | Métricas de gamificación, objetivo y rachas |
| `statsWidgetEngagement.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `statsWidgetEngagementActividad.service.js`
- `getConsistenciaDiaria`
- `getProgresoSemanal`
- `getActividad14Dias`
- `getResumenSemana`
- `getFocoHoy`

### `statsWidgetEngagementHabitos.service.js`
- `getGamificacion`
- `getObjetivoDiario`
- `getRacha`
- `getRachaTemas`

## Barrel de compatibilidad

```js
import { statsWidgetEngagementActividadService } from './statsWidgetEngagementActividad.service.js';
import { statsWidgetEngagementHabitosService } from './statsWidgetEngagementHabitos.service.js';

export const statsWidgetEngagementService = {
  ...statsWidgetEngagementActividadService,
  ...statsWidgetEngagementHabitosService,
};

export { statsWidgetEngagementActividadService, statsWidgetEngagementHabitosService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
