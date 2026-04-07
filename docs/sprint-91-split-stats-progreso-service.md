# Sprint 91 – Split statsProgreso.service

## Fecha
2026-04-07

## Objetivo
Dividir `statsProgreso.service.js` en dos sub-servicios por responsabilidad, manteniendo compatibilidad mediante barrel y sin cambios en consumidores.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `statsProgresoResumen.service.js` | Nuevo | Métodos de resumen/evolución general |
| `statsProgresoDetalle.service.js` | Nuevo | Métodos de detalle con validación por entidad |
| `statsProgreso.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `statsProgresoResumen.service.js`
- `getProgresoTemas`
- `getDashboard`
- `getUserStats`
- `getEvolucion`
- `getMisOposiciones`

### `statsProgresoDetalle.service.js`
- `getTemaStats`
- `getRepasoStats`
- `getSimulacrosStats`
- `getResumenOposicion`
- `getProgresoMaterias`
- `getProgresoTemasByMateria`
- `getDetalleTema`

## Barrel de compatibilidad

```js
import { statsProgresoResumenService } from './statsProgresoResumen.service.js';
import { statsProgresoDetalleService } from './statsProgresoDetalle.service.js';

export const statsProgresoService = {
  ...statsProgresoResumenService,
  ...statsProgresoDetalleService,
};

export { statsProgresoResumenService, statsProgresoDetalleService };
```

`stats.service.js` se mantiene sin cambios, importando `statsProgresoService` como antes.

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #238 mergeado
