# Sprint 92 – Split auth.service

## Fecha
2026-04-08

## Objetivo
Dividir `auth.service.js` en dos sub-servicios por dominio, manteniendo compatibilidad mediante barrel y sin cambios en controladores/rutas consumidoras.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `authAccess.service.js` | Nuevo | Registro e inicio de sesión |
| `authProfile.service.js` | Nuevo | Perfil del usuario y contraseña |
| `auth.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `authAccess.service.js`
- `register(payload)`
- `login(payload)`

### `authProfile.service.js`
- `getMe(userId)`
- `updateProfile(userId, fields)`
- `updatePassword(userId, { passwordActual, passwordNuevo })`

## Barrel de compatibilidad

```js
import { authAccessService } from './authAccess.service.js';
import { authProfileService } from './authProfile.service.js';

export const authService = {
  ...authAccessService,
  ...authProfileService,
};

export { authAccessService, authProfileService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #240 mergeado
