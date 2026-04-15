# Sprint 116 – Split adminPanelUsersWrite.service

## Fecha
2026-04-08

## Objetivo
Convertir `adminPanelUsersWrite.service.js` en un barrel compatible delegando la actualización de rol en un sub-servicio dedicado.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPanelUsersRole.service.js` | Nuevo | Gestión de cambio de rol de usuario con validaciones |
| `adminPanelUsersWrite.service.js` | Barrel | Compatibilidad — compone el sub-servicio de rol |

## División de responsabilidades

### `adminPanelUsersRole.service.js`
- `updateUserRole`

## Barrel de compatibilidad

```js
import { adminPanelUsersRoleService } from './adminPanelUsersRole.service.js';

export const adminPanelUsersWriteService = {
  ...adminPanelUsersRoleService,
};

export { adminPanelUsersRoleService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
