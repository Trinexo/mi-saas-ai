# Sprint 106 – Split authProfile.service

## Fecha
2026-04-08

## Objetivo
Dividir `authProfile.service.js` en sub-servicios por responsabilidad (lectura de perfil y actualización de perfil/contraseña), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `authProfileRead.service.js` | Nuevo | Lectura del perfil de usuario (`getMe`) |
| `authProfileWrite.service.js` | Nuevo | Actualización de perfil y contraseña |
| `authProfile.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `authProfileRead.service.js`
- `getMe`

### `authProfileWrite.service.js`
- `updateProfile`
- `updatePassword`

## Barrel de compatibilidad

```js
import { authProfileReadService } from './authProfileRead.service.js';
import { authProfileWriteService } from './authProfileWrite.service.js';

export const authProfileService = {
  ...authProfileReadService,
  ...authProfileWriteService,
};

export { authProfileReadService, authProfileWriteService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
