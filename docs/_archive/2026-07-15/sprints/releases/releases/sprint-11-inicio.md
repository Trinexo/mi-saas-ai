# Sprint 11 — Inicio

Fecha: 15 de marzo de 2026
Estado: en curso

## Objetivo del sprint
Cerrar tres ciclos de calidad abiertos: (1) el usuario puede reportar preguntas erróneas o confusas directamente desde la revisión post-test, cerrando el loop con el panel admin que ya consume esos reportes; (2) el usuario puede ver su evolución de nota a lo largo del tiempo para mantener la motivación; (3) el admin puede gestionar el catálogo (oposiciones, materias, temas) desde la interfaz sin depender del seed o SQL directo.

## Base técnica disponible
- `reportes_preguntas(pregunta_id, usuario_id, motivo, estado, fecha_creacion)` — tabla ya existente en `schema.sql` (Sprint 4)
- `adminRepository.listReportes` + `adminRepository.updateReporteEstado` — admin ya puede gestionar los reportes (Sprint 4)
- `ReviewPage.jsx` — botón ★/☆ por pregunta (Sprint 9); patrón de botón por pregunta ya establecido
- `resultados_test.nota` + `tests.fecha_creacion` — datos de evolución ya disponibles (Sprint 3)
- `statsRepository.getDashboard` — CTE pattern establecido (Sprint 10)
- Catálogo: tablas `oposiciones`, `materias`, `temas` — estructura definida (Sprint 1)
- `catalogApi.getOposiciones/getMaterias/getTemas` — lectura ya implementada en frontend (Sprint 3)
- Panel admin: CRUD preguntas + CSV import + auditoria + reportes — patrón establecido (Sprints 4-5)
- `requireRole('admin', 'editor')` — middleware de roles disponible (Sprint 4)

## Alcance comprometido

### P0 — Reportar pregunta (PR 01 — Backend + Frontend)

**Backend — nuevo módulo `reportes` (fichero propio, no en `admin.routes`):**

`reportes.repository.js`:
```js
async createReporte(userId, preguntaId, motivo)
  // INSERT INTO reportes_preguntas (pregunta_id, usuario_id, motivo)
  // ON CONFLICT DO NOTHING (UNIQUE usuario_id + pregunta_id — ver nota abajo)
  // Devuelve { id, created: true/false }
```
> Nota: la tabla no tiene UNIQUE(usuario_id, pregunta_id) actualmente. Se añade a `schema.sql`.

`reportes.schema.js`:
```js
export const reportarPreguntaParamsSchema = z.object({
  preguntaId: z.coerce.number().int().positive(),
});
export const reportarPreguntaBodySchema = z.object({
  motivo: z.string().min(5).max(500),
});
```

`reportes.service.js`:
- `reportar(userId, preguntaId, motivo)` — delega a repository; si ya existe → devuelve `{ already: true }`

`reportes.controller.js`:
- `reportarPregunta(req, res, next)` — 201 si creado, 200 si ya reportado

`reportes.routes.js` — `/api/v1/preguntas/:preguntaId/reportar`:
```js
router.post('/', requireAuth, validate(reportarPreguntaParamsSchema, 'params'), validate(reportarPreguntaBodySchema), reportarPregunta);
```
Montado en `routes/index.js` como `router.use('/preguntas/:preguntaId/reportar', reportesRoutes)`.

**DB — `schema.sql`:**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_reportes_usuario_pregunta
  ON reportes_preguntas(usuario_id, pregunta_id);
```
(ALTER TABLE equivalente para producción en comentario.)

**Frontend — `ReviewPage.jsx`:**
- Botón "⚑" (flag) pequeño junto al botón ★ de marcado.
- Al hacer clic abre un `<dialog>` nativo (sin librería) con:
  - `<textarea>` con placeholder "Describe el error o la confusión (mín. 5 caracteres)"
  - Botón "Enviar reporte" (llama a `reportarApi.reportar(token, preguntaId, motivo)`)
  - Botón "Cancelar"
- Estado local por pregunta: `reportadas` (Set de IDs) — si ya está en el set, el botón muestra "✓ Reportada" deshabilitado.
- `reportarApi.js`: `reportar(token, preguntaId, motivo)` → `POST /preguntas/${preguntaId}/reportar`

### P0 — Evolución de nota temporal (PR 02 — Backend + Frontend)

**Backend — extensión de `statsRepository` y `statsService`:**

`statsRepository.getEvolucion(userId, limit)`:
```sql
SELECT t.id AS test_id,
       t.fecha_creacion AS fecha,
       rt.nota,
       t.tipo_test AS modo
FROM tests t
JOIN resultados_test rt ON rt.test_id = t.id
WHERE t.usuario_id = $1
  AND t.estado = 'finalizado'
ORDER BY t.fecha_creacion ASC
LIMIT $2
```
Devuelve: `[{ testId, fecha, nota, modo }]`

`statsService.getEvolucion(userId, limit)` — valida `limit` (1–100, default 30).

`evolucionQuerySchema` en `stats.schema.js`:
```js
z.object({ limit: z.coerce.number().int().min(1).max(100).optional().default(30) })
```

Nuevo controller `getEvolucion` + ruta `GET /stats/evolucion` (requireAuth).

**Frontend — `EvolucionChart.jsx`:**
- Componente SVG puro (sin dependencias externas):
  - Eje X: fecha (puntos distribuidos uniformemente)
  - Eje Y: nota 0–10 con líneas de referencia en 0, 5, 10
  - Polilinea con puntos; color: azul
  - Tooltip nativo con `<title>` SVG (fecha + nota al hover)
  - Responsive: `viewBox="0 0 600 200"` con `width="100%"`
- Si menos de 2 puntos → muestra mensaje "Completa al menos 2 tests para ver tu evolución".
- Integrar en `ProgressPage.jsx` en una tarjeta nueva "Evolución de nota" antes de las stats por tema.
- `testApi.evolucionStats(token, limit)` → `GET /stats/evolucion?limit=N`

### P1 — Gestión de catálogo desde admin (PR 03 — Backend + Frontend)

**Backend — nuevas rutas en `admin.routes.js`:**

Endpoints para oposiciones (`requireRole('admin')`):
```
POST   /admin/catalog/oposiciones            → crear oposición
PUT    /admin/catalog/oposiciones/:id        → editar nombre
DELETE /admin/catalog/oposiciones/:id        → eliminar (solo si sin materias)
```
Endpoints para materias (`requireRole('admin', 'editor')`):
```
POST   /admin/catalog/materias               → { nombre, oposicionId }
PUT    /admin/catalog/materias/:id           → { nombre }
DELETE /admin/catalog/materias/:id           → solo si sin temas
```
Endpoints para temas (`requireRole('admin', 'editor')`):
```
POST   /admin/catalog/temas                  → { nombre, materiaId, descripcion? }
PUT    /admin/catalog/temas/:id              → { nombre, descripcion? }
DELETE /admin/catalog/temas/:id              → solo si sin preguntas
```

`catalogAdminSchema.js`:
```js
oposicionBodySchema, materiaBodySchema, temaBodySchema — nombres min(2)
idParamSchema — reutiliza el de admin.schema.js
```

`catalogAdmin.repository.js`:
```js
createOposicion(nombre)
updateOposicion(id, nombre)
deleteOposicion(id)  // error si tiene materias hijas
createMateria(nombre, oposicionId)
updateMateria(id, nombre)
deleteMateria(id)    // error si tiene temas hijos  
createTema(nombre, materiaId, descripcion)
updateTema(id, nombre, descripcion)
deleteTema(id)       // error si tiene preguntas asociadas
```

`catalogAdmin.service.js` + `catalogAdmin.controller.js` — patron estándar.

**Frontend — `AdminCatalogPage.jsx`:**
- Página nueva en `/admin/catalog`.
- Tres secciones expandibles: Oposiciones / Materias / Temas.
- Cada sección tiene tabla con botones Editar / Eliminar + formulario inline para crear nuevo.
- `adminApi.js`: 9 nuevos métodos (createOposicion, updateOposicion, deleteOposicion, createMateria, etc.).
- Link "Catálogo" en `AdminLayout.jsx`.
- Ruta `admin/catalog` en `App.jsx`.

## Fuera de alcance en este sprint
- Notificaciones push/email de repaso pendiente.
- Suscripciones y planes de pago (Sprint dedicado).
- Búsqueda de preguntas full-text.
- Ordenación configurable del catálogo (drag & drop de orden de temas).
- Geochart / analytics por comunidad autónoma.

## Criterios de Done
- Un usuario autenticado puede reportar una pregunta desde `ReviewPage` y el reporte aparece en el panel admin.
- Si el usuario ya reportó la misma pregunta, el botón queda deshabilitado ("✓ Reportada").
- `GET /stats/evolucion` devuelve la serie temporal de notas. `EvolucionChart` la renderiza como SVG.
- Un admin puede crear/editar/eliminar oposiciones, materias y temas desde `/admin/catalog`.
- Suite backend sin regresiones (≥148 pass, 0 fail).
- `vite build` sin errores.

## Riesgos
- El índice UNIQUE en `reportes_preguntas(usuario_id, pregunta_id)` puede romper reportes duplicados ya existentes en producción → mitigado con `CREATE UNIQUE INDEX ... IF NOT EXISTS` (no-blocking en nuevo entorno; en producción requiere migración con limpieza previa de duplicados).
- `DELETE /admin/catalog/oposiciones/:id` puede fallar si tiene preguntas → se devuelve `ApiError(409, 'Tiene contenido asociado')` con mensaje descriptivo.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend + Frontend | `POST /preguntas/:id/reportar` + modal en `ReviewPage` |
| 02 | Backend + Frontend | `GET /stats/evolucion` + `EvolucionChart` SVG en `ProgressPage` |
| 03 | Backend + Frontend | Gestión admin de catálogo (oposiciones/materias/temas) |

## Trazabilidad de PR ejecutados (Sprint 11)

| PR | Sprint | Objetivo principal | Estado |
|---|---|---|---|
