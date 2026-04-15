# Sprint 118 – Split testSubmitTransactional.service

## Fecha
2026-04-08

## Objetivo
Dividir `testSubmitTransactional.service.js` por fases transaccionales (preparación/evaluación y persistencia), manteniendo compatibilidad con `submitTransactional`.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testSubmitTransactionalPreparation.service.js` | Nuevo | Validación + evaluación previa al guardado |
| `testSubmitTransactionalPersistence.service.js` | Nuevo | Persistencia de respuestas/resultado y actualización de progreso |
| `testSubmitTransactional.service.js` | Refactor | Orquestación transaccional usando los sub-servicios |

## División de responsabilidades

### `testSubmitTransactionalPreparation.service.js`
- `prepareSubmission`

### `testSubmitTransactionalPersistence.service.js`
- `persistSubmission`

### `testSubmitTransactional.service.js`
- `submitTransactional` (orquestador compatible)

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
