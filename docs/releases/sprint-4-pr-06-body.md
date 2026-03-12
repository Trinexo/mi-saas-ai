## Resumen
PR 06 de Sprint 4 para mejorar consistencia de errores de validación según origen de entrada (`body`, `query`, `params`) y reforzarlo con tests.

## Qué cambia
- `validate.middleware` devuelve mensaje contextual:
  - `Payload inválido` para `body`
  - `Query inválida` para `query`
  - `Parámetros inválidos` para `params`
- Nuevo test `validate-middleware.test.js` para cubrir:
  - errores por `query`, `params`, `body`
  - parseo y coerción correcta en caso válido
- Se actualizan scripts de test para incluir el nuevo archivo.

## Alcance
- Consistencia de respuestas de error en endpoints con validación.
- Mayor cobertura de regresión en middleware crítico.

## Fuera de alcance
- Cambios de contrato de éxito (`success/data`).
- Cambios de lógica de negocio en services/repositories.

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
