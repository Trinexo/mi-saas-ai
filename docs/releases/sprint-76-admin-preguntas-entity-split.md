# Sprint 76 — Split adminPreguntasEntity.repository.js

## Objetivo

Dividir `adminPreguntasEntity.repository.js` (101 líneas, 9 métodos) en dos archivos de responsabilidad única, manteniendo compatibilidad total mediante barrel.

## Archivos afectados

### Nuevos

#### `backend/src/repositories/adminPreguntasEntityWrite.repository.js`
Operaciones de escritura sobre preguntas y sus opciones (mayoritariamente transaccionales).

| Método | Descripción |
|---|---|
| `createPregunta(client, payload)` | Inserta nueva pregunta en transacción |
| `createOpciones(client, preguntaId, opciones)` | Inserta opciones de respuesta en transacción |
| `updatePregunta(client, preguntaId, payload)` | Actualiza campos de una pregunta en transacción |
| `deleteOpciones(client, preguntaId)` | Elimina todas las opciones de una pregunta en transacción |
| `deletePregunta(preguntaId)` | Elimina una pregunta por id |

#### `backend/src/repositories/adminPreguntasEntityRead.repository.js`
Consultas, búsquedas y actualizaciones de estado sobre preguntas.

| Método | Descripción |
|---|---|
| `getPreguntaById(client, preguntaId)` | Verifica existencia de pregunta (uso en transacciones) |
| `getFullPreguntaById(preguntaId)` | Obtiene pregunta completa con opciones |
| `existsTema(temaId)` | Comprueba si existe un tema |
| `updatePreguntaEstado(preguntaId, estado)` | Actualiza el estado de moderación de una pregunta |

### Modificados

#### `backend/src/repositories/adminPreguntasEntity.repository.js` — Barrel de compatibilidad
```js
// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasEntityWrite y adminPreguntasEntityRead.
import { adminPreguntasEntityWriteRepository } from './adminPreguntasEntityWrite.repository.js';
import { adminPreguntasEntityReadRepository } from './adminPreguntasEntityRead.repository.js';

export const adminPreguntasEntityRepository = { ...adminPreguntasEntityWriteRepository, ...adminPreguntasEntityReadRepository };
export { adminPreguntasEntityWriteRepository, adminPreguntasEntityReadRepository };
```

## Importador único

`adminPreguntas.repository.js` (barrel padre) — sin cambios requeridos.

## Verificación

- Build frontend: `327.31 kB` ✅
- CI: 4/4 checks ✅
- PR código: #209 (merged `2026-04-07`)
