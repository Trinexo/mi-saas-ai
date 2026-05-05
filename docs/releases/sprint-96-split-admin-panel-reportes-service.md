# Sprint 96 – Split adminPanelReportes.service

## Fecha
2026-04-08

## Objetivo
Dividir `adminPanelReportes.service.js` en dos sub-servicios por responsabilidad (lectura/escritura), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPanelReportesRead.service.js` | Nuevo | Consultas de auditoría y reportes |
| `adminPanelReportesWrite.service.js` | Nuevo | Actualización de estado de reportes |
| `adminPanelReportes.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `adminPanelReportesRead.service.js`
- `listAuditoria(query, actor)`
- `listReportes(query)`

### `adminPanelReportesWrite.service.js`
- `updateReporteEstado(reporteId, estado)`

## Barrel de compatibilidad

```js
import { adminPanelReportesReadService } from './adminPanelReportesRead.service.js';
import { adminPanelReportesWriteService } from './adminPanelReportesWrite.service.js';

export const adminPanelReportesService = {
  ...adminPanelReportesReadService,
  ...adminPanelReportesWriteService,
};

export { adminPanelReportesReadService, adminPanelReportesWriteService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #248 mergeado
