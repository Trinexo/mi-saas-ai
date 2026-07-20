# Sprint 60 – Split adminPreguntas.repository.js

## Resumen

Se dividió `adminPreguntas.repository.js` (222 líneas, 13 métodos + 1 helper) en dos sub-archivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos resultantes

### `adminPreguntasListado.repository.js` (108 líneas, 4 métodos + helper)

| Método | Descripción |
|---|---|
| `buildWhere` | Helper privado para construir cláusula WHERE dinámica |
| `listPreguntas` | Lista preguntas con filtros y paginación |
| `countPreguntas` | Cuenta total de preguntas filtradas |
| `listPreguntasSinRevisar` | Lista preguntas pendientes de revisión |
| `getPreguntasPorEstado` | Estadísticas agrupadas por estado |

### `adminPreguntasEntity.repository.js` (91 líneas, 9 métodos)

| Método | Descripción |
|---|---|
| `createPregunta` | Inserta nueva pregunta (transaccional) |
| `createOpciones` | Inserta opciones de respuesta (transaccional) |
| `getPreguntaById` | Obtiene pregunta por ID (transaccional) |
| `getFullPreguntaById` | Obtiene pregunta completa con opciones |
| `updatePregunta` | Actualiza pregunta (transaccional) |
| `deleteOpciones` | Elimina opciones (transaccional) |
| `deletePregunta` | Elimina pregunta |
| `existsTema` | Verifica existencia de tema |
| `updatePreguntaEstado` | Actualiza estado de una pregunta |

### `adminPreguntas.repository.js` (8 líneas – barrel de compatibilidad)

Re-exporta `adminPreguntasListado` y `adminPreguntasEntity` como `adminPreguntasRepository` unificado.

## Impacto

- **Barrel superior** `admin.repository.js` no requiere cambios (importa `adminPreguntasRepository`).
- **Build**: sin cambios en tamaño (327.31 kB).
- **CI**: 4/4 checks passed.

## PRs

- Código: #177
- Documentación: #178
