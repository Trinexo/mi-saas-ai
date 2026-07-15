# Sprint 74 — Split testEvaluation.service.js

## Objetivo

Dividir `testEvaluation.service.js` (121 líneas, 4 métodos) en dos archivos de responsabilidad única, manteniendo compatibilidad total mediante barrel.

## Archivos afectados

### Nuevos

#### `backend/src/services/testSubmit.service.js`
Evaluación y envío de un test con transacción completa.

| Método | Descripción |
|---|---|
| `submit({userId, testId, respuestas, tiempoSegundos})` | Evalúa respuestas, calcula nota, persiste resultado y dispara repetición espaciada (fire-and-forget) |

Dependencias: `pool`, `ApiError`, `testRepository`, `spacedRepetitionRepository`

#### `backend/src/services/testQuery.service.js`
Consultas de historial y detalle de tests completados.

| Método | Descripción |
|---|---|
| `getHistory({userId, limit, page, oposicionId, desde, hasta})` | Historial paginado de tests del usuario |
| `getReview({userId, testId})` | Detalle de revisión de un test con respuestas |
| `getConfig({userId, testId})` | Configuración con la que se generó el test |

Dependencias: `ApiError`, `testRepository`

### Modificados

#### `backend/src/services/testEvaluation.service.js` — Barrel de compatibilidad
```js
// Barrel de compatibilidad - los metodos se han dividido en testSubmit y testQuery.
import { testSubmitService } from './testSubmit.service.js';
import { testQueryService } from './testQuery.service.js';

export const testEvaluationService = { ...testSubmitService, ...testQueryService };
export { testSubmitService, testQueryService };
```

## Importador único

`test.service.js` (barrel padre) — sin cambios requeridos.

## Verificación

- Build frontend: `327.31 kB` ✅
- CI: 4/4 checks ✅
- PR código: #205 (merged `2026-04-07`)
