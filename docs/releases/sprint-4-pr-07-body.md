## Resumen
PR 07 de Sprint 4 para reforzar `GET /admin/reportes` con validación de query y optimización de índice para filtro+ordenación.

## Qué cambia
- Se añade `listReportesQuerySchema` con coerción y límites:
  - `page` entero positivo (default `1`)
  - `page_size` entero entre `1` y `100` (default `20`)
  - `estado` opcional en enum válido
- Ruta `GET /admin/reportes` pasa por `validate(..., 'query')`.
- `adminService.listReportes` consume query ya normalizada por middleware.
- Índice nuevo en SQL:
  - `idx_reportes_estado_fecha_id (estado, fecha_creacion DESC, id DESC)`
- Test nuevo `admin-reportes-query.test.js` para cubrir rechazo/aceptación/defaults.

## Justificación técnica
- Evita consultas con paginación inválida o descontrolada.
- Mejora rendimiento de listado filtrado por estado y ordenado por fecha/id.
- Mantiene consistencia de errores (`Query inválida`) como el resto de endpoints validados.

## Alcance
- Backend admin/reportes (validación + consulta).
- Cobertura de tests de middleware+schema.

## Fuera de alcance
- Cambios en UI del panel admin.
- Refactor de otros endpoints admin.

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
