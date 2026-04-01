# Sprint 52 — Split admin.service.js en adminPreguntas y adminPanel

## Resumen

Refactorización del servicio de administración backend: `admin.service.js` (361 líneas) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (10 líneas).

## Motivación

`admin.service.js` mezclaba dos dominios distintos en 361 líneas:
- Lógica de negocio sobre el ciclo de vida de preguntas (CRUD, importación CSV, revisión de contenido)
- Operaciones de panel de control (auditoría, reportes, gestión de usuarios, estadísticas globales, analytics)

## Cambios

### Archivos creados

#### `backend/src/services/adminPreguntas.service.js`
- **Propósito**: Lógica de negocio del ciclo de vida de preguntas en el panel de administración
- **Líneas**: ~271
- **Helpers privados**: `normalizeHeader`, `parseCsvLine`, `requiredHeaders`
- **Imports**: `pool`, `ApiError`, `adminRepository`, `createPreguntaSchema`
- **Métodos** (9):
  - `listPreguntas` — listado paginado con filtros
  - `createPregunta` — creación en transacción + auditoría (estado inicial según rol)
  - `getPregunta` — obtención con 404 si no existe
  - `updatePregunta` — actualización en transacción + auditoría
  - `deletePregunta` — borrado con snapshot previo + auditoría
  - `importPreguntasCsv` — importación masiva desde CSV con validación fila a fila
  - `listPreguntasSinRevisar` — cola de revisión con paginación
  - `updatePreguntaEstado` — cambio de estado restringido a revisores y admins
  - `getPreguntasPorEstado` — distribución de preguntas por estado

#### `backend/src/services/adminPanel.service.js`
- **Propósito**: Lógica de negocio de las operaciones transversales del panel de control
- **Líneas**: ~94
- **Imports**: `ApiError`, `adminRepository`
- **Métodos** (7):
  - `listAuditoria` — historial de auditoría (solo admin)
  - `listReportes` — reportes de preguntas con paginación
  - `updateReporteEstado` — resolución de reporte con 404 si no existe
  - `getAdminStats` — métricas globales del dashboard admin
  - `listUsers` — gestión de usuarios con búsqueda y paginación
  - `updateUserRole` — cambio de rol (protegido contra auto-cambio)
  - `getTemasConMasErrores` — analytics de temas con mayor tasa de error

### Archivos modificados

#### `backend/src/services/admin.service.js` → barrel (10 líneas)
Fusiona ambos servicios en `adminService` para compatibilidad total:

```js
// Barrel de compatibilidad
import { adminPreguntasService } from './adminPreguntas.service.js';
import { adminPanelService } from './adminPanel.service.js';

export const adminService = {
  ...adminPreguntasService,
  ...adminPanelService,
};

export { adminPreguntasService, adminPanelService };
```

#### `backend/src/controllers/admin.controller.js` — sin cambios
#### `backend/tests/services/admin-auditoria-service.test.js` — sin cambios
#### `backend/tests/services/admin-profesor-scope.test.js` — sin cambios

## Métricas

| Archivo | Antes | Después |
|---|---|---|
| `admin.service.js` | 361 líneas | 10 líneas (barrel) |
| `adminPreguntas.service.js` | — | ~271 líneas |
| `adminPanel.service.js` | — | ~94 líneas |

## Compatibilidad

- **`admin.controller.js`**: Sin cambios. Importa `adminService` del barrel.
- **Tests**: Sin cambios. Importan `adminService` del barrel y mutan `adminRepository[key]` directamente.
- **Nuevos consumidores**: Pueden importar `adminPreguntasService` o `adminPanelService` por separado.

## CI

- `build-frontend`: ✅ pass
- `test-backend`: ✅ pass (4/4 checks)

## PR

- Código: #161 — `refactor(backend): dividir admin.service.js en adminPreguntas y adminPanel`
- Docs: #162 (este PR)
