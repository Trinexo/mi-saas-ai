# Sprint 75 — Split adminDashboard.repository.js

## Objetivo

Dividir `adminDashboard.repository.js` (102 líneas, 4 métodos) en dos archivos de responsabilidad única, manteniendo compatibilidad total mediante barrel.

## Archivos afectados

### Nuevos

#### `backend/src/repositories/adminDashboardStats.repository.js`
Métricas y estadísticas globales de la plataforma.

| Método | Descripción |
|---|---|
| `getAdminStats()` | Estadísticas globales: preguntas, usuarios, tests, nota media |
| `getTemasConMasErrores(limit)` | Ranking de temas con mayor porcentaje de error |

#### `backend/src/repositories/adminDashboardUsers.repository.js`
Gestión de usuarios desde el panel de administración.

| Método | Descripción |
|---|---|
| `listUsers({role, q}, limit, offset)` | Listado paginado de usuarios con filtros por rol y búsqueda |
| `updateUserRole(userId, role)` | Actualización del rol de un usuario |

### Modificados

#### `backend/src/repositories/adminDashboard.repository.js` — Barrel de compatibilidad
```js
// Barrel de compatibilidad - los metodos se han dividido en adminDashboardStats y adminDashboardUsers.
import { adminDashboardStatsRepository } from './adminDashboardStats.repository.js';
import { adminDashboardUsersRepository } from './adminDashboardUsers.repository.js';

export const adminDashboardRepository = { ...adminDashboardStatsRepository, ...adminDashboardUsersRepository };
export { adminDashboardStatsRepository, adminDashboardUsersRepository };
```

## Importador único

`adminPanel.repository.js` (barrel padre) — sin cambios requeridos.

## Verificación

- Build frontend: `327.31 kB` ✅
- CI: 4/4 checks ✅
- PR código: #207 (merged `2026-04-07`)
