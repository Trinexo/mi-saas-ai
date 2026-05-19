# Sprint 114 – Split adminPanelReportesWrite.service

## Fecha
2026-04-08

## Objetivo
Convertir `adminPanelReportesWrite.service.js` en un barrel compatible delegando la operación de cambio de estado en un sub-servicio dedicado.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPanelReportesEstado.service.js` | Nuevo | Gestión de cambio de estado de reportes |
| `adminPanelReportesWrite.service.js` | Barrel | Compatibilidad — compone el sub-servicio de estado |

## División de responsabilidades

### `adminPanelReportesEstado.service.js`
- `updateReporteEstado`

## Barrel de compatibilidad

```js
import { adminPanelReportesEstadoService } from './adminPanelReportesEstado.service.js';

export const adminPanelReportesWriteService = {
  ...adminPanelReportesEstadoService,
};

export { adminPanelReportesEstadoService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
