## Resumen
PR 09 de Sprint 4 para endurecer `GET /admin/preguntas` con validación de query, coerción tipada y límites de paginación/filtros.

## Qué cambia
- Nuevo schema `listPreguntasQuerySchema` con:
  - `page` entero positivo (default `1`)
  - `page_size` entero entre `1` y `100` (default `20`)
  - `oposicion_id`, `materia_id`, `tema_id` enteros positivos opcionales
  - `nivel_dificultad` entero `1..5` opcional
- Ruta `GET /admin/preguntas` usa `validate(listPreguntasQuerySchema, 'query')`.
- `adminService.listPreguntas` pasa a consumir query ya validada/coaccionada.
- Nuevo test `admin-preguntas-query.test.js` para rechazo/aceptación/defaults.
- Scripts de test actualizados para incluir el nuevo archivo.

## Justificación técnica
- Previene consultas inválidas y paginación descontrolada.
- Homogeneiza validación de query en endpoints admin.
- Reduce lógica de parseo manual en service.

## Alcance
- Backend admin/preguntas (schema, ruta, service y tests).

## Fuera de alcance
- Cambios en UI del panel admin.
- Cambios en repositorio SQL para este endpoint.

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
