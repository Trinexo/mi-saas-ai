# Sprint 107 – Split statsProgresoDetalle.service

## Fecha
2026-04-08

## Objetivo
Dividir `statsProgresoDetalle.service.js` por ámbito funcional (tema/materia y oposición), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `statsProgresoDetalleTema.service.js` | Nuevo | Métricas de tema y materia |
| `statsProgresoDetalleOposicion.service.js` | Nuevo | Métricas agregadas de oposición |
| `statsProgresoDetalle.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `statsProgresoDetalleTema.service.js`
- `getTemaStats`
- `getRepasoStats`
- `getProgresoTemasByMateria`
- `getDetalleTema`

### `statsProgresoDetalleOposicion.service.js`
- `getSimulacrosStats`
- `getResumenOposicion`
- `getProgresoMaterias`

## Barrel de compatibilidad

```js
import { statsProgresoDetalleTemaService } from './statsProgresoDetalleTema.service.js';
import { statsProgresoDetalleOposicionService } from './statsProgresoDetalleOposicion.service.js';

export const statsProgresoDetalleService = {
  ...statsProgresoDetalleTemaService,
  ...statsProgresoDetalleOposicionService,
};

export { statsProgresoDetalleTemaService, statsProgresoDetalleOposicionService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
