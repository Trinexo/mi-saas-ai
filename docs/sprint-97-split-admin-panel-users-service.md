# Sprint 97 – Split adminPanelUsers.service

## Fecha
2026-04-08

## Objetivo
Dividir `adminPanelUsers.service.js` en dos sub-servicios por responsabilidad (lectura/escritura), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPanelUsersRead.service.js` | Nuevo | Lecturas de usuarios y métricas asociadas |
| `adminPanelUsersWrite.service.js` | Nuevo | Mutaciones de usuarios |
| `adminPanelUsers.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `adminPanelUsersRead.service.js`
- `getAdminStats`
- `listUsers`
- `getTemasConMasErrores`

### `adminPanelUsersWrite.service.js`
- `updateUserRole`

## Barrel de compatibilidad

```js
import { adminPanelUsersReadService } from './adminPanelUsersRead.service.js';
import { adminPanelUsersWriteService } from './adminPanelUsersWrite.service.js';

export const adminPanelUsersService = {
  ...adminPanelUsersReadService,
  ...adminPanelUsersWriteService,
};

export { adminPanelUsersReadService, adminPanelUsersWriteService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #250 mergeado
