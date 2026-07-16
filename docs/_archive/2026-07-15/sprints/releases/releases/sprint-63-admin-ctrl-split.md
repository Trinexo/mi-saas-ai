# Sprint 63 – Split admin.controller.js

## Resumen

Se dividió `admin.controller.js` (147 líneas, 16 handlers) en dos sub-archivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos resultantes

### `adminPreguntas.controller.js` (74 líneas, 9 handlers)

| Handler | Descripción |
|---|---|
| `listPreguntas` | Listar preguntas con filtros |
| `getPregunta` | Obtener pregunta por ID |
| `createPregunta` | Crear nueva pregunta |
| `updatePregunta` | Actualizar pregunta |
| `deletePregunta` | Eliminar pregunta |
| `importPreguntasCsv` | Importar preguntas desde CSV |
| `listPreguntasSinRevisar` | Listar preguntas pendientes de revisión |
| `updatePreguntaEstado` | Cambiar estado de pregunta |
| `getPreguntasPorEstado` | Estadísticas por estado |

### `adminPanel.controller.js` (59 líneas, 7 handlers)

| Handler | Descripción |
|---|---|
| `listReportes` | Listar reportes |
| `updateReporteEstado` | Actualizar estado de reporte |
| `listAuditoria` | Listar auditoría |
| `getAdminStats` | Estadísticas del panel admin |
| `listUsers` | Listar usuarios |
| `updateUserRole` | Cambiar rol de usuario |
| `getTemasConMasErrores` | Temas con más errores |

### `admin.controller.js` (3 líneas – barrel de compatibilidad)

Re-exporta con `export *` ambos sub-archivos.

## Impacto

- **Routes** `admin.routes.js` no requiere cambios (named imports through barrel).
- **Build**: sin cambios (327.31 kB).
- **CI**: 4/4 checks passed.

## PRs

- Código: #183
- Documentación: #184
