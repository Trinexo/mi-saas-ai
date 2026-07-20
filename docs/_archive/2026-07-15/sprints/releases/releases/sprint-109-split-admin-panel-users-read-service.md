# Sprint 109 – Split adminPanelUsersRead.service

## Fecha
2026-04-08

## Objetivo
Dividir `adminPanelUsersRead.service.js` por dominio funcional (métricas y listado de usuarios), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPanelUsersStats.service.js` | Nuevo | Métricas del panel de usuarios |
| `adminPanelUsersList.service.js` | Nuevo | Listado paginado de usuarios con filtros |
| `adminPanelUsersRead.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `adminPanelUsersStats.service.js`
- `getAdminStats`
- `getTemasConMasErrores`

### `adminPanelUsersList.service.js`
- `listUsers`

## Barrel de compatibilidad

```js
import { adminPanelUsersStatsService } from './adminPanelUsersStats.service.js';
import { adminPanelUsersListService } from './adminPanelUsersList.service.js';

export const adminPanelUsersReadService = {
  ...adminPanelUsersStatsService,
  ...adminPanelUsersListService,
};

export { adminPanelUsersStatsService, adminPanelUsersListService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
