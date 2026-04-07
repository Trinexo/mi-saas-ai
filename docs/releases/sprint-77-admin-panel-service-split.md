# Sprint 77 — Split adminPanel.service.js

## Objetivo

Dividir `adminPanel.service.js` (94 líneas, 6 métodos) en dos archivos de responsabilidad única, manteniendo compatibilidad total mediante barrel.

## Archivos afectados

### Nuevos

#### `backend/src/services/adminPanelReportes.service.js`
Gestión de reportes de preguntas y log de auditoría.

| Método | Descripción |
|---|---|
| `listAuditoria(query, actor)` | Listado paginado del log de auditoría (requiere rol admin) |
| `listReportes(query)` | Listado paginado de reportes con filtro por estado |
| `updateReporteEstado(reporteId, estado)` | Actualiza el estado de un reporte |

#### `backend/src/services/adminPanelUsers.service.js`
Gestión de usuarios y estadísticas globales del panel.

| Método | Descripción |
|---|---|
| `getAdminStats()` | Estadísticas globales de la plataforma |
| `listUsers(query)` | Listado paginado de usuarios con filtros |
| `updateUserRole(userId, role, requestingUser)` | Cambio de rol (protegido: no puede auto-modificarse) |
| `getTemasConMasErrores(limit)` | Ranking de temas con mayor tasa de error |

### Modificados

#### `backend/src/services/adminPanel.service.js` — Barrel de compatibilidad
```js
// Barrel de compatibilidad - los metodos se han dividido en adminPanelReportes y adminPanelUsers.
import { adminPanelReportesService } from './adminPanelReportes.service.js';
import { adminPanelUsersService } from './adminPanelUsers.service.js';

export const adminPanelService = { ...adminPanelReportesService, ...adminPanelUsersService };
export { adminPanelReportesService, adminPanelUsersService };
```

## Importador único

`admin.service.js` (barrel padre) — sin cambios requeridos.

## Verificación

- Build frontend: `327.31 kB` ✅
- CI: 4/4 checks ✅
- PR código: #211 (merged `2026-04-07`)
