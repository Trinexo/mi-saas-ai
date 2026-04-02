# Release Notes — Sprint 65: adminPreguntasCrud.service.js split

## Descripción

División de `adminPreguntasCrud.service.js` (146 líneas, 8 métodos) en dos sub-servicios separados por tipo de operación (lectura / escritura).

## Archivos modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `backend/src/services/adminPreguntasCrud.service.js` | Barrel | 146 → 6 líneas |
| `backend/src/services/adminPreguntasCrudRead.service.js` | Nuevo | 4 métodos de lectura |
| `backend/src/services/adminPreguntasCrudWrite.service.js` | Nuevo | 4 métodos de escritura |

## Criterio de división

| Sub-servicio | Tipo | Métodos |
|---|---|---|
| `adminPreguntasCrudReadService` | Lectura (sin efectos secundarios) | `listPreguntas`, `getPregunta`, `listPreguntasSinRevisar`, `getPreguntasPorEstado` |
| `adminPreguntasCrudWriteService` | Escritura (con transacciones DB + auditoría) | `createPregunta`, `updatePregunta`, `deletePregunta`, `updatePreguntaEstado` |

### `adminPreguntasCrudRead.service.js`
- Imports: `ApiError`, `adminRepository`
- Métodos de consulta y listado sin efectos secundarios

### `adminPreguntasCrudWrite.service.js`
- Imports: `pool`, `ApiError`, `adminRepository`
- Métodos con `BEGIN/COMMIT/ROLLBACK` y llamadas a `insertAuditoria`

## Barrel de compatibilidad

```js
// adminPreguntasCrud.service.js
import { adminPreguntasCrudReadService } from './adminPreguntasCrudRead.service.js';
import { adminPreguntasCrudWriteService } from './adminPreguntasCrudWrite.service.js';

export const adminPreguntasCrudService = { ...adminPreguntasCrudReadService, ...adminPreguntasCrudWriteService };
export { adminPreguntasCrudReadService, adminPreguntasCrudWriteService };
```

El barrel `adminPreguntas.service.js` no requiere cambios.

## Verificación

- Build frontend: **327.31 kB** ✅
- CI: build-frontend ✅, test-backend ✅
- PR #187 mergeado en main
