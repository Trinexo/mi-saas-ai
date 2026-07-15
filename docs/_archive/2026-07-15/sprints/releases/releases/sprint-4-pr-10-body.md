## Resumen
PR 10 de Sprint 4 para endurecer validación de query en endpoints públicos de catálogo (`materias`, `temas`, `preguntas`) y eliminar parseo manual en controller.

## Qué cambia
- Nuevo archivo [backend/src/schemas/catalog.schema.js](backend/src/schemas/catalog.schema.js) con schemas:
  - `materiasQuerySchema`
  - `temasQuerySchema`
  - `preguntasQuerySchema`
- Se aplica `validate(..., 'query')` en [backend/src/routes/v1/catalog.routes.js](backend/src/routes/v1/catalog.routes.js).
- [backend/src/controllers/catalog.controller.js](backend/src/controllers/catalog.controller.js) deja de parsear manualmente query params.
- [backend/src/services/catalog.service.js](backend/src/services/catalog.service.js) consume `page` y `pageSize` ya normalizados.
- Nuevo test [backend/tests/services/catalog-query.test.js](backend/tests/services/catalog-query.test.js).
- Scripts de test actualizados en [backend/package.json](backend/package.json).

## Justificación técnica
- Unifica el patrón de validación entre admin, stats y catálogo.
- Evita queries inválidas o silenciosamente corregidas en catálogo público.
- Reduce lógica distribuida en controllers.

## Alcance
- Endpoints públicos de catálogo.
- Middleware/schema/tests.

## Fuera de alcance
- Cambios en frontend.
- Cambios en repositorios SQL.

## Tipo de cambio
- [x] feat
- [x] fix
- [x] test
- [x] docs
- [ ] chore

## Checklist
- [ ] PR hacia `main`
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Rama actualizada con `main`
- [ ] Sin archivos temporales

## Validación local
- `backend/npm run test` ✅
