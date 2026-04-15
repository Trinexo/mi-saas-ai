# Sprint 108 – Split adminPanelReportesRead.service

## Fecha
2026-04-08

## Objetivo
Dividir `adminPanelReportesRead.service.js` por tipo de lectura (auditoría y listado de reportes), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPanelReportesAuditoria.service.js` | Nuevo | Lectura paginada de auditoría con control de acceso admin |
| `adminPanelReportesLista.service.js` | Nuevo | Lectura paginada de reportes por estado |
| `adminPanelReportesRead.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `adminPanelReportesAuditoria.service.js`
- `listAuditoria`

### `adminPanelReportesLista.service.js`
- `listReportes`

## Barrel de compatibilidad

```js
import { adminPanelReportesAuditoriaService } from './adminPanelReportesAuditoria.service.js';
import { adminPanelReportesListaService } from './adminPanelReportesLista.service.js';

export const adminPanelReportesReadService = {
  ...adminPanelReportesAuditoriaService,
  ...adminPanelReportesListaService,
};

export { adminPanelReportesAuditoriaService, adminPanelReportesListaService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
