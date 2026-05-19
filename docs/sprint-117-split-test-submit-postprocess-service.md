# Sprint 117 – Split testSubmitPostProcess.service

## Fecha
2026-04-08

## Objetivo
Dividir `testSubmitPostProcess.service.js` por responsabilidad (repetición espaciada y construcción de respuesta), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testSubmitPostProcessSpaced.service.js` | Nuevo | Postproceso asíncrono de repetición espaciada |
| `testSubmitPostProcessResponse.service.js` | Nuevo | Construcción del payload de respuesta de submit |
| `testSubmitPostProcess.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `testSubmitPostProcessSpaced.service.js`
- `runSpacedRepetition`

### `testSubmitPostProcessResponse.service.js`
- `buildSubmitResponse`

## Barrel de compatibilidad

```js
import { testSubmitPostProcessSpacedService } from './testSubmitPostProcessSpaced.service.js';
import { testSubmitPostProcessResponseService } from './testSubmitPostProcessResponse.service.js';

export const testSubmitPostProcessService = {
  ...testSubmitPostProcessSpacedService,
  ...testSubmitPostProcessResponseService,
};

export { testSubmitPostProcessSpacedService, testSubmitPostProcessResponseService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
