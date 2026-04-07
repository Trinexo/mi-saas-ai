# Sprint 73 — Split adminPreguntasListado.repository.js

## Objetivo

Dividir `adminPreguntasListado.repository.js` (124 líneas, 4 métodos) en dos archivos de responsabilidad única, manteniendo compatibilidad total mediante barrel.

## Archivos afectados

### Nuevos

#### `backend/src/repositories/adminPreguntasListadoBrowse.repository.js`
Listado y paginación general de preguntas del banco.

| Método | Descripción |
|---|---|
| `listPreguntas(filters, limit, offset)` | Listado paginado con filtros por oposición, materia, tema y nivel |
| `countPreguntas(filters)` | Cuenta total de preguntas para paginación |

Incluye helper privado `buildWhere` para construcción dinámica del WHERE.

#### `backend/src/repositories/adminPreguntasListadoRevision.repository.js`
Gestión del flujo de revisión y moderación de preguntas.

| Método | Descripción |
|---|---|
| `listPreguntasSinRevisar(filters, limit, offset)` | Listado paginado de preguntas en estado `pendiente` |
| `getPreguntasPorEstado()` | Distribución de preguntas agrupada por estado |

### Modificados

#### `backend/src/repositories/adminPreguntasListado.repository.js` — Barrel de compatibilidad
```js
// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasListadoBrowse y adminPreguntasListadoRevision.
import { adminPreguntasListadoBrowseRepository } from './adminPreguntasListadoBrowse.repository.js';
import { adminPreguntasListadoRevisionRepository } from './adminPreguntasListadoRevision.repository.js';

export const adminPreguntasListadoRepository = { ...adminPreguntasListadoBrowseRepository, ...adminPreguntasListadoRevisionRepository };
export { adminPreguntasListadoBrowseRepository, adminPreguntasListadoRevisionRepository };
```

## Importador único

`adminPreguntas.repository.js` (barrel padre) — sin cambios requeridos.

## Verificación

- Build frontend: `327.31 kB` ✅
- CI: 4/4 checks ✅
- PR código: #203 (merged `2026-04-07`)
