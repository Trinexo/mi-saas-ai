## Resumen
PR 08 de Sprint 4 para endurecer validación de `:id` en endpoints admin y asegurar consistencia de errores en parámetros de ruta.

## Qué cambia
- Nuevo schema `idParamSchema` con coerción a entero positivo.
- Se aplica `validate(idParamSchema, 'params')` en:
  - `GET /admin/preguntas/:id`
  - `PUT /admin/preguntas/:id`
  - `DELETE /admin/preguntas/:id`
  - `PATCH /admin/reportes/:id/estado`
- `admin.controller` usa `req.params.id` ya validado (sin parse manual adicional).
- Nuevo test `admin-id-params.test.js` para cubrir rechazo/aceptación de `id`.
- Scripts de test actualizados para incluir el nuevo archivo.

## Justificación técnica
- Evita pasar IDs inválidos a servicios/repositorios.
- Homogeneiza errores (`Parámetros inválidos`) con el middleware de validación.
- Reduce riesgo de edge cases por parseo manual distribuido.

## Alcance
- Backend admin (rutas + controller + schema + tests).

## Fuera de alcance
- Cambios de payloads de éxito.
- Cambios en UI del panel admin.

## Tipo de cambio
- [ ] feat
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
