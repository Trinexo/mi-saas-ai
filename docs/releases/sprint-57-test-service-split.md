# Sprint 57 — Split test.service.js en testGeneration y testEvaluation

## Resumen

Refactorizacion del servicio de tests: `test.service.js` (245 lineas, 6 metodos + 1 helper) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (10 lineas).

## Motivacion

`test.service.js` mezclaba dos dominios distintos en 245 lineas:
- Generacion de tests: seleccion de preguntas por modo (adaptativo, marcadas, simulacro, repaso, refuerzo), cuotas de dificultad, fallback
- Evaluacion y consulta: correccion de respuestas, calculo de nota, actualizacion de progreso, repeticion espaciada, historial y revision

Separar ambos dominios permite evolucionar la logica de generacion (nuevos modos, algoritmos) sin afectar la evaluacion y viceversa.

## Cambios

### Archivos creados

#### `backend/src/services/testGeneration.service.js`
- **Proposito**: Generacion de tests y seleccion de preguntas
- **Lineas**: 128
- **Imports**: `ApiError`, `testRepository`
- **Metodos** (2):
  - `generate` — generacion principal con modos adaptativo, marcadas, simulacro, repaso; cuotas de dificultad mixta; fallback por tema
  - `generateRefuerzo` — generacion de tests de refuerzo desde preguntas falladas con completado adaptativo

#### `backend/src/services/testEvaluation.service.js`
- **Proposito**: Evaluacion de tests, historial y revision
- **Lineas**: 121
- **Helper privado**: `calcNota` (calculo de nota con penalizacion 0.33 por error)
- **Imports**: `pool`, `ApiError`, `testRepository`, `spacedRepetitionRepository`
- **Metodos** (4):
  - `submit` — correccion transaccional de respuestas, calculo de nota, actualizacion de progreso, fire-and-forget de repeticion espaciada
  - `getHistory` — historial paginado de tests del usuario
  - `getReview` — revision detallada de un test completado
  - `getConfig` — configuracion de un test

### Archivos modificados

#### `backend/src/services/test.service.js` → barrel (10 lineas)
Fusiona ambos servicios en `testService` para compatibilidad total:

```js
// Barrel de compatibilidad - los metodos se han dividido en testGeneration y testEvaluation.
import { testGenerationService } from './testGeneration.service.js';
import { testEvaluationService } from './testEvaluation.service.js';

export const testService = {
  ...testGenerationService,
  ...testEvaluationService,
};

export { testGenerationService, testEvaluationService };
```

#### `backend/src/controllers/test.controller.js` — sin cambios

## Metricas

| Archivo | Antes | Despues |
|---|---|---|
| `test.service.js` | 245 lineas | 10 lineas (barrel) |
| `testGeneration.service.js` | — | 128 lineas |
| `testEvaluation.service.js` | — | 121 lineas |

## Compatibilidad

- **`test.controller.js`**: Sin cambios. Importa `testService` del barrel.
- **Nuevos consumidores**: Pueden importar `testGenerationService` o `testEvaluationService` por separado.

## CI

- Build frontend: OK (327.31 kB)
- Tests backend: 4/4 checks passed
- PR codigo: #171
- PR docs: #172
