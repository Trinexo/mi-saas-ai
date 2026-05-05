# Sprint 110 – Split testGenerationRefuerzo.service

## Fecha
2026-04-08

## Objetivo
Dividir `testGenerationRefuerzo.service.js` en sub-servicios por responsabilidad (selección de preguntas y persistencia de test), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testGenerationRefuerzoSelection.service.js` | Nuevo | Selección de preguntas de refuerzo con fallback adaptativo |
| `testGenerationRefuerzoPersistence.service.js` | Nuevo | Persistencia del test de refuerzo y construcción de respuesta |
| `testGenerationRefuerzo.service.js` | Barrel | Compatibilidad — conserva `generateRefuerzo` y compone sub-servicios |

## División de responsabilidades

### `testGenerationRefuerzoSelection.service.js`
- `selectPreguntasRefuerzo`

### `testGenerationRefuerzoPersistence.service.js`
- `persistRefuerzoTest`

### `testGenerationRefuerzo.service.js`
- `generateRefuerzo` (orquestador compatible)

## Barrel de compatibilidad

```js
import { testGenerationRefuerzoSelectionService } from './testGenerationRefuerzoSelection.service.js';
import { testGenerationRefuerzoPersistenceService } from './testGenerationRefuerzoPersistence.service.js';

export const testGenerationRefuerzoService = {
  async generateRefuerzo(params) {
    const preguntas = await testGenerationRefuerzoSelectionService.selectPreguntasRefuerzo(params);
    return testGenerationRefuerzoPersistenceService.persistRefuerzoTest({
      userId: params.userId,
      temaId: params.temaId,
      preguntas,
    });
  },
  ...testGenerationRefuerzoSelectionService,
  ...testGenerationRefuerzoPersistenceService,
};
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
