# Sprint 103 – Split testGenerationGenerate.service

## Fecha
2026-04-08

## Objetivo
Dividir `testGenerationGenerate.service.js` en sub-servicios por responsabilidad (orquestación, selección de preguntas y persistencia/respuesta), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testGenerationGenerateOrchestrator.service.js` | Nuevo | Orquesta el flujo `generate` |
| `testGenerationGenerateSelection.service.js` | Nuevo | Selección de preguntas por modo/dificultad y fallback |
| `testGenerationGeneratePersistence.service.js` | Nuevo | Persistencia del test generado y armado de respuesta |
| `testGenerationGenerate.service.js` | Barrel | Compatibilidad — compone los tres sub-servicios |

## División de responsabilidades

### `testGenerationGenerateOrchestrator.service.js`
- `generate`

### `testGenerationGenerateSelection.service.js`
- `selectPreguntas`

### `testGenerationGeneratePersistence.service.js`
- `persistAndBuildResponse`

## Barrel de compatibilidad

```js
import { testGenerationGenerateOrchestratorService } from './testGenerationGenerateOrchestrator.service.js';
import { testGenerationGenerateSelectionService } from './testGenerationGenerateSelection.service.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';

export const testGenerationGenerateService = {
  ...testGenerationGenerateOrchestratorService,
  ...testGenerationGenerateSelectionService,
  ...testGenerationGeneratePersistenceService,
};
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
