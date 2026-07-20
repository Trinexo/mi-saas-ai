# Sprint 59 – Split adminPanel.repository.js

## Resumen

Se dividió `adminPanel.repository.js` (232 líneas, 10 métodos) en dos sub-archivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos resultantes

### `adminReportes.repository.js` (133 líneas, 6 métodos)

| Método | Descripción |
|---|---|
| `listReportes` | Lista reportes con paginación y filtros |
| `countReportes` | Cuenta total de reportes filtrados |
| `updateReporteEstado` | Actualiza estado de un reporte |
| `insertAuditoria` | Inserta registro de auditoría |
| `listAuditoria` | Lista registros de auditoría con paginación |
| `countAuditoria` | Cuenta total de registros de auditoría |

### `adminDashboard.repository.js` (102 líneas, 4 métodos)

| Método | Descripción |
|---|---|
| `getAdminStats` | Obtiene estadísticas generales del panel admin |
| `listUsers` | Lista usuarios con paginación y búsqueda |
| `updateUserRole` | Actualiza rol de un usuario |
| `getTemasConMasErrores` | Obtiene temas con mayor tasa de error |

### `adminPanel.repository.js` (10 líneas – barrel de compatibilidad)

Re-exporta `adminReportes` y `adminDashboard` como `adminPanelRepository` unificado.

```js
import { adminReportesRepository } from './adminReportes.repository.js';
import { adminDashboardRepository } from './adminDashboard.repository.js';
export const adminPanelRepository = { ...adminReportesRepository, ...adminDashboardRepository };
export { adminReportesRepository, adminDashboardRepository };
```

## Impacto

- **Barrel superior** `admin.repository.js` no requiere cambios (importa `adminPanelRepository`).
- **Build**: sin cambios en tamaño (327.31 kB).
- **CI**: 4/4 checks passed.

## PRs

- Código: #175
- Documentación: #176
