# Sprint 72 — Split adminReportes.repository.js

## Objetivo

Dividir `adminReportes.repository.js` (133 líneas, 6 métodos) en dos archivos de responsabilidad única, manteniendo compatibilidad total mediante barrel.

## Archivos afectados

### Nuevos

#### `backend/src/repositories/adminReportesPreguntas.repository.js`
Gestión de reportes de preguntas enviados por usuarios.

| Método | Descripción |
|---|---|
| `listReportes(filters, limit, offset)` | Listado paginado de reportes con filtros por estado y preguntaId |
| `countReportes(filters)` | Cuenta total de reportes para paginación |
| `updateReporteEstado(reporteId, estado)` | Actualiza el estado de un reporte (pendiente / revisado / descartado) |

#### `backend/src/repositories/adminReportesAuditoria.repository.js`
Registro de auditoría de acciones administrativas.

| Método | Descripción |
|---|---|
| `insertAuditoria({accion, preguntaId, userId, userRole, datosAnteriores})` | Inserta nuevo registro de auditoría |
| `listAuditoria({page, pageSize, preguntaId, usuarioId, accion})` | Listado paginado del log de auditoría |
| `countAuditoria({preguntaId, usuarioId, accion})` | Cuenta registros de auditoría para paginación |

### Modificados

#### `backend/src/repositories/adminReportes.repository.js` — Barrel de compatibilidad
```js
// Barrel de compatibilidad - los metodos se han dividido en adminReportesPreguntas y adminReportesAuditoria.
import { adminReportesPreguntasRepository } from './adminReportesPreguntas.repository.js';
import { adminReportesAuditoriaRepository } from './adminReportesAuditoria.repository.js';

export const adminReportesRepository = { ...adminReportesPreguntasRepository, ...adminReportesAuditoriaRepository };
export { adminReportesPreguntasRepository, adminReportesAuditoriaRepository };
```

## Importador único

`adminPanel.repository.js` — sin cambios requeridos.

## Verificación

- Build frontend: `327.31 kB` ✅
- CI: 4/4 checks ✅
- PR código: #201 (merged `2026-04-07`)
