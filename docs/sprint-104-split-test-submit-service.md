# Sprint 104 – Split testSubmit.service

## Fecha
2026-04-08

## Objetivo
Dividir `testSubmit.service.js` en sub-servicios por fase (orquestación, transaccional y postproceso), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testSubmitOrchestrator.service.js` | Nuevo | Orquesta el flujo `submit` |
| `testSubmitTransactional.service.js` | Nuevo | Validación + scoring + persistencia transaccional |
| `testSubmitPostProcess.service.js` | Nuevo | Actualización asíncrona de repetición espaciada y respuesta |
| `testSubmit.service.js` | Barrel | Compatibilidad — compone los sub-servicios |

## División de responsabilidades

### `testSubmitOrchestrator.service.js`
- `submit`

### `testSubmitTransactional.service.js`
- `submitTransactional`

### `testSubmitPostProcess.service.js`
- `runSpacedRepetition`
- `buildSubmitResponse`

## Barrel de compatibilidad

```js
import { testSubmitOrchestratorService } from './testSubmitOrchestrator.service.js';
import { testSubmitTransactionalService } from './testSubmitTransactional.service.js';
import { testSubmitPostProcessService } from './testSubmitPostProcess.service.js';

export const testSubmitService = {
  ...testSubmitOrchestratorService,
  ...testSubmitTransactionalService,
  ...testSubmitPostProcessService,
};
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
