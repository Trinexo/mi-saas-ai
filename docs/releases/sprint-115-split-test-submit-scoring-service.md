# Sprint 115 – Split testSubmitScoring.service

## Fecha
2026-04-08

## Objetivo
Dividir `testSubmitScoring.service.js` por responsabilidad (cálculo de nota y evaluación de respuestas), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testSubmitScoringNota.service.js` | Nuevo | Cálculo de nota final |
| `testSubmitScoringEvaluacion.service.js` | Nuevo | Evaluación de respuestas y agregados de scoring |
| `testSubmitScoring.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `testSubmitScoringNota.service.js`
- `calcNota`

### `testSubmitScoringEvaluacion.service.js`
- `evaluateRespuestas`

## Barrel de compatibilidad

```js
import { testSubmitScoringNotaService } from './testSubmitScoringNota.service.js';
import { testSubmitScoringEvaluacionService } from './testSubmitScoringEvaluacion.service.js';

export const testSubmitScoringService = {
  ...testSubmitScoringNotaService,
  ...testSubmitScoringEvaluacionService,
};

export { testSubmitScoringNotaService, testSubmitScoringEvaluacionService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
