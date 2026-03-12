## Resumen
PR 03 de Sprint 4 enfocado en endurecer validaciones de entrada y consistencia de errores en `stats/tema`.

## Qué cambia
- `validate` middleware ahora soporta fuente configurable (`body`, `query`, `params`).
- Se añade esquema `temaStatsQuerySchema` para validar `tema_id` en query.
- Ruta `GET /stats/tema` aplica validación explícita de query.
- Controlador de stats deja de parsear manualmente `tema_id` y usa valor validado.
- Servicio refuerza validación semántica: `temaId` debe ser entero positivo.
- Se amplían tests de regresión para temaId decimal/no positivo.

## Alcance
- Robustez de validación en endpoint de estadísticas por tema.
- Consistencia de errores de entrada.

## Fuera de alcance
- Cambios funcionales en generación/corrección de tests.
- Cambios de UI.

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] docs
- [ ] chore
- [x] test

## Checklist
- [ ] PR hacia `main`
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Rama actualizada con `main`
- [ ] Sin archivos temporales

## Validación local
- `backend/npm run test` ✅
- `backend/npm run test:smoke` ✅
