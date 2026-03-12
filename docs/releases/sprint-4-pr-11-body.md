## Resumen
PR 11 de Sprint 4 para alinear el frontend con el contrato de query del backend mediante serialización centralizada en el cliente API.

## Qué cambia
- [frontend/src/services/api.js](frontend/src/services/api.js): `apiRequest` ahora acepta `query` y serializa parámetros de forma centralizada.
- [frontend/src/services/catalogApi.js](frontend/src/services/catalogApi.js): usa `query` para `materias` y `temas`.
- [frontend/src/services/adminApi.js](frontend/src/services/adminApi.js): `listPreguntas` y `listReportes` pasan a query object.
- [frontend/src/services/testApi.js](frontend/src/services/testApi.js): `temaStats` usa query object.
- [frontend/src/pages/admin/AdminQuestionsPage.jsx](frontend/src/pages/admin/AdminQuestionsPage.jsx): deja de construir `URLSearchParams` manualmente.

## Justificación técnica
- Evita composición manual y dispersa de query strings.
- Reduce riesgo de claves vacías, nulas o mal codificadas.
- Alinea el frontend con el endurecimiento reciente de validación en backend.

## Alcance
- Cliente HTTP frontend y consumidores directos.

## Fuera de alcance
- Cambios visuales.
- Nuevos componentes o estados UX.

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
