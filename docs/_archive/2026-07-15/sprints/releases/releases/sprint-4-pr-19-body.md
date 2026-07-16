## Resumen
PR 19 de Sprint 4 para endurecer la UX técnica de progreso en frontend, evitando fallos silenciosos en el catálogo y en las estadísticas por tema.

## Qué cambia
- [frontend/src/pages/ProgressPage.jsx](frontend/src/pages/ProgressPage.jsx):
  - separa el error global de carga de progreso de los errores secundarios de catálogo y detalle por tema,
  - añade estados de carga explícitos para progreso, catálogo y estadísticas por tema,
  - muestra mensajes útiles cuando fallan oposiciones, materias, temas o estadísticas del tema,
  - resetea correctamente estados dependientes al cambiar oposición o materia.

## Justificación técnica
- Tras el PR 17 aún quedaban errores silenciosos en la pantalla de progreso.
- Un fallo en cargas secundarias no debe dejar al usuario sin feedback.
- Se mejora la previsibilidad de la pantalla sin depender del hook reusable aplazado para PR18.

## Alcance
- Robustez y UX de estados en frontend.

## Fuera de alcance
- Refactor compartido con hooks async.
- Cambios en panel admin.
- Tests frontend.

## Tipo de cambio
- [x] feat
- [x] fix
- [x] docs
- [ ] test
- [ ] chore

## Checklist
- [ ] PR hacia main
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Rama actualizada con `main`
- [ ] Sin archivos temporales

## Validación local
- Build frontend en worktree limpio ejecutada con éxito ✅
- Sin errores estáticos en [frontend/src/pages/ProgressPage.jsx](frontend/src/pages/ProgressPage.jsx) ✅