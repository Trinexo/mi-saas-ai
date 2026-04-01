# Sprint 50 — Split admin.repository.js en adminPreguntas y adminPanel

## Resumen

Refactorización del repositorio de administración backend: `admin.repository.js` (451 líneas) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (11 líneas).

## Motivación

`admin.repository.js` mezclaba dos dominios distintos en 451 líneas:
- Operaciones CRUD sobre preguntas y su flujo de revisión
- Operaciones de panel de control (reportes, auditoría, estadísticas, gestión de usuarios, analytics)

La separación por dominio facilita la localización de código y reduce el acoplamiento entre responsabilidades.

## Cambios

### Archivos creados

#### `backend/src/repositories/adminPreguntas.repository.js`
- **Propósito**: Queries relacionadas con el ciclo de vida de preguntas en el panel de administración
- **Líneas**: ~222
- **Helpers**: `buildWhere` (filtrado dinámico por oposición, materia, tema y nivel)
- **Métodos** (14):
  - `listPreguntas` — listado paginado con filtros
  - `countPreguntas` — total para paginación
  - `createPregunta` — inserción en transacción
  - `createOpciones` — inserción de opciones en transacción
  - `getPreguntaById` — lookup por id (en transacción)
  - `getFullPreguntaById` — pregunta completa con opciones
  - `updatePregunta` — actualización en transacción
  - `deleteOpciones` — borrado de opciones en transacción
  - `deletePregunta` — borrado de pregunta
  - `existsTema` — comprobación de existencia de tema
  - `listPreguntasSinRevisar` — cola de revisión paginada
  - `updatePreguntaEstado` — cambio de estado (pendiente/aprobada/rechazada)
  - `getPreguntasPorEstado` — distribución por estado

#### `backend/src/repositories/adminPanel.repository.js`
- **Propósito**: Queries de operaciones transversales del panel de control
- **Líneas**: ~232
- **Métodos** (10):
  - `listReportes` — reportes de preguntas paginados con filtros
  - `countReportes` — total para paginación
  - `updateReporteEstado` — resolución de reporte
  - `insertAuditoria` — registro de acción en log de auditoría
  - `listAuditoria` — historial de auditoría paginado con filtros
  - `countAuditoria` — total para paginación
  - `getAdminStats` — métricas globales del dashboard admin
  - `listUsers` — gestión de usuarios paginada con búsqueda
  - `updateUserRole` — cambio de rol de usuario
  - `getTemasConMasErrores` — analytics de temas con mayor tasa de error

### Archivos modificados

#### `backend/src/repositories/admin.repository.js` → barrel (11 líneas)
Re-exporta ambos repositorios y fusiona sus métodos en `adminRepository` para mantener compatibilidad total con `admin.service.js` y los tests existentes:

```js
// Barrel de compatibilidad
import { adminPreguntasRepository } from './adminPreguntas.repository.js';
import { adminPanelRepository } from './adminPanel.repository.js';

export const adminRepository = {
  ...adminPreguntasRepository,
  ...adminPanelRepository,
};

export { adminPreguntasRepository, adminPanelRepository };
```

#### `backend/src/services/admin.service.js` — sin cambios
El servicio sigue importando `adminRepository` desde el barrel. Los tests (patrón de mutación de métodos en `adminRepository`) funcionan sin modificaciones porque mutan el objeto fusionado que el servicio usa.

## Métricas

| Archivo | Antes | Después |
|---|---|---|
| `admin.repository.js` | 451 líneas | 11 líneas (barrel) |
| `adminPreguntas.repository.js` | — | ~222 líneas |
| `adminPanel.repository.js` | — | ~232 líneas |

## Compatibilidad

- **`admin.service.js`**: Sin cambios. Sigue usando `adminRepository` del barrel.
- **Tests** (`admin-auditoria-service.test.js`, `admin-profesor-scope.test.js`): Sin cambios. Mutan `adminRepository[key]` directamente; el servicio recoge esas mutaciones porque llama a través del mismo objeto fusionado.
- **Nuevos consumidores**: Pueden importar `adminPreguntasRepository` o `adminPanelRepository` directamente.

## CI

- `build-frontend`: ✅ pass
- `test-backend`: ✅ pass (4/4 checks)

## PR

- Código: #157 — `refactor(backend): dividir admin.repository.js en adminPreguntas y adminPanel`
- Docs: #158 (este PR)
