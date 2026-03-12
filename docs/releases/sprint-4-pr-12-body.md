## Resumen
PR 12 de Sprint 4 para reforzar el cliente HTTP del frontend ante respuestas vacías o no JSON sin cambiar el contrato de uso actual.

## Qué cambia
- [frontend/src/services/api.js](frontend/src/services/api.js):
  - parseo seguro de respuestas con `response.text()`
  - soporte explícito para `204 No Content`
  - fallback controlado si el servidor devuelve texto plano o JSON inválido
  - retorno `null` cuando la respuesta exitosa no trae `data`

## Justificación técnica
- Evita roturas del frontend si una respuesta no trae cuerpo JSON.
- Reduce errores de parsing en casos de respuesta vacía o inesperada.
- Mejora resiliencia de toda la capa de servicios sin tocar call sites.

## Alcance
- Cliente API común del frontend.

## Fuera de alcance
- Cambios visuales.
- Nuevas pantallas.
- Refactor de servicios consumidores.

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
