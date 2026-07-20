## Resumen
PR 13 de Sprint 4 para estandarizar el manejo de mensajes de error en pantallas frontend apoyándose en un helper común del cliente API.

## Qué cambia
- [frontend/src/services/api.js](frontend/src/services/api.js): nuevo helper `getErrorMessage`.
- Pantallas actualizadas para usar el helper en lugar de `e.message` directo:
  - [frontend/src/pages/HomePage.jsx](frontend/src/pages/HomePage.jsx)
  - [frontend/src/pages/LoginPage.jsx](frontend/src/pages/LoginPage.jsx)
  - [frontend/src/pages/RegisterPage.jsx](frontend/src/pages/RegisterPage.jsx)
  - [frontend/src/pages/TestPage.jsx](frontend/src/pages/TestPage.jsx)
  - [frontend/src/pages/ProgressPage.jsx](frontend/src/pages/ProgressPage.jsx)
  - [frontend/src/pages/admin/AdminQuestionsPage.jsx](frontend/src/pages/admin/AdminQuestionsPage.jsx)
- En Home también se capturan explícitamente errores de carga de materias y temas.

## Justificación técnica
- Evita depender de `error.message` sin fallback.
- Unifica mensajes mostrados al usuario ante fallos de red/API.
- Mejora robustez de formularios y pantallas sin cambiar UX estructural.

## Alcance
- Manejo de errores en frontend.

## Fuera de alcance
- Cambios de estilos.
- Refactor de componentes.
- Nuevos tests de frontend.

## Tipo de cambio
- [x] feat
- [x] fix
- [x] docs
- [ ] test
- [ ] chore

## Checklist
- [ ] PR hacia `main`
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Rama actualizada con `main`
- [ ] Sin archivos temporales

## Validación local
- `frontend/npm run build` ✅
