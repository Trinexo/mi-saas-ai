# Sprint 4 — PR 20 — Body

## Resumen
PR 20 de Sprint 4 para añadir trazabilidad completa de cambios sobre el banco de preguntas: tabla de auditoría, registro automático en cada operación CRUD del admin y endpoint de consulta paginado para rol `admin`.

## Qué cambia

### Base de datos
- Nueva tabla `auditoria_preguntas` con campos: `accion` (`create`/`update`/`delete`), `pregunta_id`, `usuario_id`, `usuario_role`, `fecha`, `datos_anteriores` (JSONB snapshot pre-cambio).
- Tres índices: `idx_auditoria_pregunta`, `idx_auditoria_usuario`, `idx_auditoria_fecha`.

### Backend
- `adminRepository`: métodos `insertAuditoria`, `listAuditoria` (paginable con filtros por `pregunta_id`, `usuarioId`, `accion`), `countAuditoria`.
- `adminService`: fire-and-forget en `createPregunta`, `updatePregunta` y `deletePregunta`. Captura snapshot `datosAnteriores` antes de `update` y `delete`.
- `admin.schema.js`: `listAuditoriaQuerySchema` con Zod (page, page_size, pregunta_id, usuario_id, accion).
- `adminController`: `listAuditoria` delegando a service.
- `admin.routes.js`: `GET /admin/auditoria` protegido con `requireRole('admin')` + `validate(listAuditoriaQuerySchema, 'query')`.

### Frontend
- `adminApi.js`: `listAuditoria(token, query)`.
- `AdminQuestionsPage.jsx`: sección "Auditoría de cambios en preguntas" visible solo para `admin`, con filtros (pregunta_id, usuario_id, accion), tabla paginada de eventos y controles de paginación.

## Justificación técnica
- El registro de auditoría se ejecuta fuera de la transacción principal con `.catch(() => {})` para no bloquear ni hacer rollback de operaciones CRUD si el INSERT de auditoría falla.
- El snapshot `datos_anteriores` se toma antes de la operación destructiva para garantizar fidelidad del estado previo.

## Alcance
- Trazabilidad completa de CRUD sobre preguntas en panel admin.
- Endpoint de consulta de auditoría restringido a rol `admin`.

## Fuera de alcance
- Auditoría de otras entidades (materias, temas, oposiciones).
- Exportación de eventos de auditoría.
- Retención automática o purga de registros.

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] docs
- [ ] test
- [ ] chore

## Checklist
- [x] PR hacia main
- [x] CI en verde (`test-backend`, `build-frontend`)
- [x] Índices en `database/schema.sql`
- [x] Fire-and-forget: auditoría nunca bloquea CRUD
- [x] Snapshot previo capturado en update y delete
- [x] Endpoint restringido a `admin`

## Validación local
- `node --test backend/tests/services/admin-auditoria-schema.test.js` — 4 tests ✅
- `node --test backend/tests/services/admin-auditoria-service.test.js` — 3 tests ✅
- Build frontend: `194.53 kB` en `1.46 s` ✅
- Suite completa: `60 pass, 0 fail` ✅
