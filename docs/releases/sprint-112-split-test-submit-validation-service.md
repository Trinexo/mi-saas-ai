# Sprint 112 – Split testSubmitValidation.service

## Fecha
2026-04-08

## Objetivo
Dividir `testSubmitValidation.service.js` por dominio funcional (validaciones del test y validaciones de respuestas), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testSubmitValidationTest.service.js` | Nuevo | Validaciones sobre estado/propiedad del test |
| `testSubmitValidationRespuestas.service.js` | Nuevo | Validaciones sobre respuestas enviadas |
| `testSubmitValidation.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `testSubmitValidationTest.service.js`
- `assertTestExistsAndOwner`
- `assertTestNotFinalized`

### `testSubmitValidationRespuestas.service.js`
- `assertNoDuplicateRespuestas`
- `assertPreguntasBelongToTest`

## Barrel de compatibilidad

```js
import { testSubmitValidationTestService } from './testSubmitValidationTest.service.js';
import { testSubmitValidationRespuestasService } from './testSubmitValidationRespuestas.service.js';

export const testSubmitValidationService = {
  ...testSubmitValidationTestService,
  ...testSubmitValidationRespuestasService,
};

export { testSubmitValidationTestService, testSubmitValidationRespuestasService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
