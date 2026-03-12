## Resumen
PR 04 de Sprint 4 para mejorar la semántica de `stats/user`: contar solo tests finalizados (con resultado), no tests simplemente generados.

## Qué cambia
- `statsRepository.getUserStats` pasa de `LEFT JOIN` a `JOIN` con `resultados_test`.
- `total_tests` se calcula con `COUNT(rt.test_id)` para reflejar solo intentos enviados/corregidos.
- Smoke test reforzado para evitar fragilidad por dataset pequeño y mantener cobertura del comportamiento esperado.

## Alcance
- Consistencia de métricas de usuario.
- Robustez de regresión E2E.

## Fuera de alcance
- Cambios en UI.
- Cambios en generación/corrección del motor de test.

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
