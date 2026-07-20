# Sprint 56 — Split adminPreguntas.service.js en adminPreguntasCrud y adminPreguntasImport

## Resumen

Refactorizacion del servicio de preguntas del admin: `adminPreguntas.service.js` (271 lineas, 8 metodos + 3 helpers) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (10 lineas).

## Motivacion

`adminPreguntas.service.js` mezclaba dos dominios distintos en 271 lineas:
- CRUD de preguntas y gestion de estados de revision (crear, leer, actualizar, eliminar, listar pendientes, cambiar estado)
- Importacion masiva por CSV con parseo, validacion y helpers privados

Separar ambos dominios permite evolucionar la importacion (nuevos formatos, validaciones) sin afectar el CRUD y viceversa.

## Cambios

### Archivos creados

#### `backend/src/services/adminPreguntasCrud.service.js`
- **Proposito**: CRUD de preguntas y gestion de estados de revision
- **Lineas**: 146
- **Imports**: `pool`, `ApiError`, `adminRepository`
- **Metodos** (8):
  - `listPreguntas` — listado paginado con filtros (oposicion, materia, tema, dificultad)
  - `createPregunta` — crear pregunta con transaccion (estado segun rol)
  - `getPregunta` — obtener pregunta completa por ID
  - `updatePregunta` — actualizar pregunta y opciones con transaccion
  - `deletePregunta` — eliminar pregunta con snapshot para auditoria
  - `listPreguntasSinRevisar` — preguntas pendientes de revision con filtros
  - `updatePreguntaEstado` — cambiar estado (solo revisores y admins)
  - `getPreguntasPorEstado` — conteo de preguntas por estado

#### `backend/src/services/adminPreguntasImport.service.js`
- **Proposito**: Importacion masiva de preguntas desde CSV
- **Lineas**: 130
- **Helpers privados**: `normalizeHeader`, `parseCsvLine`, `requiredHeaders`
- **Imports**: `pool`, `ApiError`, `adminRepository`, `createPreguntaSchema`
- **Metodos** (1):
  - `importPreguntasCsv` — parseo CSV, validacion por fila, insercion transaccional con reporte de errores

### Archivos modificados

#### `backend/src/services/adminPreguntas.service.js` → barrel (10 lineas)
Fusiona ambos servicios en `adminPreguntasService` para compatibilidad total:

```js
// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasCrud y adminPreguntasImport.
import { adminPreguntasCrudService } from './adminPreguntasCrud.service.js';
import { adminPreguntasImportService } from './adminPreguntasImport.service.js';

export const adminPreguntasService = {
  ...adminPreguntasCrudService,
  ...adminPreguntasImportService,
};

export { adminPreguntasCrudService, adminPreguntasImportService };
```

#### `backend/src/services/admin.service.js` — sin cambios (barrel de nivel superior)
#### `backend/src/controllers/admin.controller.js` — sin cambios

## Metricas

| Archivo | Antes | Despues |
|---|---|---|
| `adminPreguntas.service.js` | 271 lineas | 10 lineas (barrel) |
| `adminPreguntasCrud.service.js` | — | 146 lineas |
| `adminPreguntasImport.service.js` | — | 130 lineas |

## Compatibilidad

- **`admin.service.js`**: Sin cambios. Importa `adminPreguntasService` del barrel y lo extiende en su propio barrel.
- **`admin.controller.js`**: Sin cambios. Consume `adminService` que incluye todos los metodos.
- **Nuevos consumidores**: Pueden importar `adminPreguntasCrudService` o `adminPreguntasImportService` por separado.

## CI

- Build frontend: OK (327.31 kB)
- Tests backend: 4/4 checks passed
- PR codigo: #169
- PR docs: #170
