# Sprint 132 — Estadísticas del profesor: URLs por slug y página de detalle por tema

**Fecha de apertura:** 16 de mayo de 2026  
**Fecha de cierre:** 18 de mayo de 2026  
**Tipo:** Backend + Frontend / UX + Bugfixes  
**Estado:** Completado

---

## Objetivo

Mejorar el área de estadísticas del workspace del profesor en tres ejes:

1. **URLs con significado semántico** para las páginas de oposición y tema (slug en lugar de ID numérico).
2. **Nueva página dedicada** de estadísticas por tema (`ProfesorTemaDetallePage`).
3. **Corrección de bugs** en la gráfica de rendimiento y en las queries de base de datos.

---

## Implementado

### 1. Columna `slug` en la tabla `oposiciones`

**Migración:** `database/migrations/032_add_slug_to_oposiciones.sql`

```sql
ALTER TABLE oposiciones ADD COLUMN IF NOT EXISTS slug VARCHAR(200);

UPDATE oposiciones SET slug = REGEXP_REPLACE(LOWER(nombre), '[^a-z0-9]+', '-', 'g');
UPDATE oposiciones SET slug = REGEXP_REPLACE(slug, '^-|-$', '', 'g');
UPDATE oposiciones SET slug = slug || '-' || id WHERE EXISTS (
  SELECT 1 FROM oposiciones o2 WHERE o2.slug = oposiciones.slug AND o2.id <> oposiciones.id
);

ALTER TABLE oposiciones ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS oposiciones_slug_idx ON oposiciones(slug);
```

Slugs generados:

| ID | Nombre | Slug |
|---|---|---|
| 1 | Auxiliar Administrativo | `auxiliar-administrativo` |
| 2 | Auxilio Judicial | `auxilio-judicial` |
| 3 | Gestión Procesal | `gesti-n-procesal` |
| 4 | Tramitación Judicial | `tramitaci-n-judicial` |

---

### 2. URLs por slug en el workspace del profesor

#### Antes → Después

| Página | URL anterior | URL nueva |
|---|---|---|
| Detalle oposición | `/profesor/oposiciones/2` | `/profesor/estadisticas/auxilio-judicial` |
| Detalle tema | `/profesor/temas/2` | `/profesor/estadisticas/auxilio-judicial/2` |

#### Backend

**`backend/src/repositories/profesorWorkspaceAnalytics.repository.js`**
- `listOposiciones` — añadido `o.slug` al SELECT.
- `getTemario` — añadido `o.slug AS oposicion_slug` al SELECT.
- `getOposicionIdBySlug(userId, slug)` — nuevo método que resuelve el ID a partir del slug.
- `getTemaDetalle(userId, temaId)` — nuevo método (ver sección 3).

**`backend/src/schemas/profesorWorkspace.schema.js`**
- Añadido `slugParamSchema`: `z.object({ slug: z.string().min(1).max(200) })`.

**`backend/src/controllers/profesorWorkspace.controller.js`**
- `getWorkspaceOposicion`: usa `req.params.slug` en lugar de `req.params.id`.
- `getWorkspaceTema`: nuevo handler para el endpoint de detalle de tema.

**`backend/src/routes/v1/profesorWorkspace.routes.js`**
- `GET /oposiciones/:slug` — validado con `slugParamSchema`.
- `GET /temas/:id` — nuevo endpoint validado con `idParamSchema`.

#### Frontend

**`frontend/src/App.jsx`**
- `estadisticas/:slug/:temaId` → `ProfesorTemaDetallePage` (nueva ruta).
- `estadisticas/:slug` → `ProfesorOposicionDetallePage` (ruta actualizada).
- `temas/:temaId` → redirect a `/profesor/estadisticas` (compatibilidad con URLs antiguas).
- `oposiciones/:id` → redirect a `/profesor/oposiciones` (compatibilidad).

**`frontend/src/pages/profesor/ProfesorOposicionesPage.jsx`**
- "Ver estadísticas" apunta a `/profesor/estadisticas/${o.slug}`.

**`frontend/src/pages/profesor/ProfesorDashboardPage.jsx`**
- Link de oposición apunta a `/profesor/estadisticas/${oposicion.slug}`.

**`frontend/src/pages/profesor/ProfesorTemarioPage.jsx`**
- "Ver detalle" apunta a `/profesor/estadisticas/${tema.oposicion_slug}/${tema.tema_id}`.

---

### 3. Nueva página: ProfesorTemaDetallePage

**Ruta:** `/profesor/estadisticas/:slug/:temaId`  
**Archivo:** `frontend/src/pages/profesor/ProfesorTemaDetallePage.jsx`

#### KPIs mostrados
- Total preguntas del tema
- Media de aciertos (%)
- Tasa de fallo (%)
- Reportes abiertos

#### Secciones
- **Tabla de preguntas** con `veces_respondida` y `tasa_acierto` por pregunta.
- **Panel de reportes pendientes** (estado `abierto` o `en_revision`) con motivo del alumno.
- Botón "Ver oposición" usando `tema.oposicion_slug` para navegar hacia atrás.

#### API
**`frontend/src/services/profesorApi.js`**
- `getWorkspaceTema: (token, temaId) => apiRequest('/profesor/workspace/temas/${temaId}', { token })`

#### Backend — `getTemaDetalle`

**`backend/src/repositories/profesorWorkspaceAnalytics.repository.js`**

Ejecuta tres queries en paralelo (`Promise.all`):
1. **Tema** — datos del tema con métricas agregadas (aciertos, errores, blancos, preguntas totales).
2. **Preguntas** — listado con `veces_respondida` y `tasa_acierto`.
3. **Reportes** — últimos 15 reportes abiertos del tema con el motivo del alumno.

**`backend/src/services/profesorWorkspaceAnalytics.service.js`**
- `temaDetalle(userId, temaId)` — lanza `ApiError(404)` si el tema no existe o no pertenece al profesor.

---

### 4. Mejoras en ProfesorOposicionDetallePage

#### Gráfica "Rendimiento por tema"
- Altura dinámica calculada como `rendimiento.length * 44` px.
- Contenedor scrollable cuando el número de temas supera el espacio visible.
- `YAxisTick` personalizado como componente SVG para evitar wrapping de etiquetas largas.
- `LabelList` añadido para mostrar el porcentaje al final de cada barra.

#### Temas con mayor tasa de fallo
- Fix: se filtran ahora los temas **sin actividad** (`total === 0`) antes de calcular la tasa.
- Antes, un tema con 0 respuestas producía una tasa de fallo del 100% por división entre cero.
- Los nombres de tema en la tabla son ahora **enlaces clickables** a `/profesor/estadisticas/:slug/:temaId`.

---

### 5. Fix — columnas incorrectas en query de `reportes_preguntas`

**Causa:** La query de reportes en `getTemaDetalle` usaba columnas que no existen en la tabla.

| Campo usado (incorrecto) | Campo real |
|---|---|
| `rp.tipo` | No existe — eliminar |
| `rp.descripcion` | No existe — eliminar |
| `rp.fecha_reporte` | `rp.fecha_creacion` |

**Columnas reales de `reportes_preguntas`:** `id`, `pregunta_id`, `usuario_id`, `motivo`, `estado`, `fecha_creacion`.

**Fix backend** (`profesorWorkspaceAnalytics.repository.js`):
```sql
-- Antes (incorrecto):
SELECT rp.id, rp.tipo, rp.descripcion, rp.estado, rp.fecha_reporte, ...
ORDER BY rp.fecha_reporte DESC

-- Después (correcto):
SELECT rp.id, rp.motivo, rp.estado, rp.fecha_creacion, ...
ORDER BY rp.fecha_creacion DESC
```

**Fix frontend** (`ProfesorTemaDetallePage.jsx`):
- `{r.tipo}` → etiqueta fija `"Reporte"`.
- `{r.descripcion}` → `{r.motivo}`.
- Eliminada la línea `{r.descripcion && ...}` (campo inexistente).

---

## Archivos modificados

| Archivo | Operación |
|---|---|
| `database/migrations/032_add_slug_to_oposiciones.sql` | **Nuevo** — migración slug |
| `backend/src/repositories/profesorWorkspaceAnalytics.repository.js` | Modificado — slug, getOposicionIdBySlug, getTemaDetalle, fix reportes |
| `backend/src/services/profesorWorkspaceAnalytics.service.js` | Modificado — temaDetalle |
| `backend/src/schemas/profesorWorkspace.schema.js` | Modificado — slugParamSchema |
| `backend/src/controllers/profesorWorkspace.controller.js` | Modificado — getWorkspaceOposicion por slug, getWorkspaceTema |
| `backend/src/routes/v1/profesorWorkspace.routes.js` | Modificado — rutas slug y temas/:id |
| `frontend/src/App.jsx` | Modificado — rutas estadisticas/:slug/:temaId y redirect temas |
| `frontend/src/pages/profesor/ProfesorOposicionDetallePage.jsx` | Modificado — gráfica, tasaFallo, links temas |
| `frontend/src/pages/profesor/ProfesorOposicionesPage.jsx` | Modificado — link a slug |
| `frontend/src/pages/profesor/ProfesorDashboardPage.jsx` | Modificado — link a slug |
| `frontend/src/pages/profesor/ProfesorTemarioPage.jsx` | Modificado — link con oposicion_slug/tema_id |
| `frontend/src/pages/profesor/ProfesorTemaDetallePage.jsx` | **Nuevo** — página detalle de tema |
| `frontend/src/services/profesorApi.js` | Modificado — getWorkspaceTema |

---

## Addendum — Fixes dashboard administrador + integridad `oposicion_id`

**Fecha:** 18 de mayo de 2026

### 6. Fix — Dashboard administrador (5 bugs)

Archivo: `backend/src/repositories/adminDashboardStats.repository.js`  
Archivo: `frontend/src/pages/admin/AdminDashboardPage.jsx`

#### 6.1 `nota_media_global` mostraba `0.2%`

**Causa:** `AVG(rt.nota)` operaba sobre la escala 0–10 de la columna `nota` y el frontend lo mostraba como porcentaje.  
**Fix:** Se reemplazó por porcentaje real de aciertos:

```sql
-- Antes:
ROUND(AVG(rt.nota)::numeric, 1) AS nota_media_global

-- Después:
ROUND(100.0 * SUM(rt.aciertos)::numeric / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0), 1) AS nota_media_global
```

#### 6.2 Evolución de usuarios — gráfica vacía

**Causa:** `<Line dataKey="usuarios">` buscaba un campo que no existe; la query devuelve `nuevos_usuarios`.  
**Fix:** Corregido `dataKey` en `AdminDashboardPage.jsx`:

```jsx
// Antes:
<Line dataKey="usuarios" />
// Después:
<Line dataKey="nuevos_usuarios" />
```

#### 6.3 Actividad reciente — lista vacía

**Causa:** La query leía de `actividad_global`, tabla con 0 filas (ningún proceso la alimenta).  
**Fix:** Reemplazado por un feed en tiempo real con `UNION ALL` sobre tres fuentes reales:

```sql
WITH feed AS (
  SELECT 'test_finalizado' AS tipo, t.id, COALESCE(t.fecha_fin, t.fecha_creacion) AS fecha,
         u.nombre, u.email, t.tipo_test || ' finalizado' AS descripcion, o.nombre AS entidad
  FROM tests t JOIN usuarios u ON u.id = t.usuario_id
  LEFT JOIN oposiciones o ON o.id = t.oposicion_id WHERE t.estado = 'finalizado'
  UNION ALL
  SELECT 'reporte', rp.id, rp.fecha_creacion, u.nombre, u.email,
         'Reporte de pregunta', o.nombre
  FROM reportes_preguntas rp JOIN preguntas p ON p.id = rp.pregunta_id
  JOIN temas te ON te.id = p.tema_id JOIN oposiciones o ON o.id = te.oposicion_id
  JOIN usuarios u ON u.id = rp.usuario_id
  UNION ALL
  SELECT 'registro', u.id, u.fecha_registro, u.nombre, u.email,
         'Nuevo usuario registrado', NULL
  FROM usuarios u WHERE u.deleted_at IS NULL
)
SELECT * FROM feed ORDER BY fecha DESC LIMIT $1
```

#### 6.4 Tests esta semana — contaba 7 días rodantes

**Causa:** Filtro `NOW() - INTERVAL '7 days'` no coincide con semana natural (lunes a domingo).  
**Fix:** Cambiado a semana ISO:

```sql
-- Antes:
WHERE t.fecha_creacion >= NOW() - INTERVAL '7 days'
-- Después:
WHERE t.fecha_creacion >= DATE_TRUNC('week', CURRENT_TIMESTAMP)
```

#### 6.5 Top oposiciones — mostraba 0 tests

**Causas:**
1. Alias de columna `total_tests_30d` no coincidía con `total_accesos` que espera el frontend.
2. Tests creados con `oposicion_id = NULL` (pero `tema_id` válido) no se contaban.
3. Filtro de 30 días excluía actividad histórica.

**Fix backend:**
- Alias corregido a `total_accesos`.
- Añadido linkage por `tema_id` mediante subconsulta `EXISTS`.
- Eliminado filtro de 30 días.

**Fix frontend** (`AdminDashboardPage.jsx`):
- Badge de estado ahora es dinámico (`op.estado` en lugar de `"Activa"` hardcoded).
- Tooltip actualizado a `"Tests finalizados totales"`.

---

### 7. Fix — `oposicion_id` derivado automáticamente en `createTest`

**Causa:** Al crear un test por tema (sin especificar oposición explícitamente), `oposicion_id` quedaba `NULL` en la tabla `tests`, aunque era derivable desde `temas.oposicion_id`. Esto provocaba que esos tests no apareciesen en los conteos por oposición.

**Fix:** `backend/src/repositories/testSessionWriteSetup.repository.js`

```js
// Antes:
oposicionId || null

// Después — si temaId está presente y oposicionId es null, se deriva:
let resolvedOposicionId = oposicionId || null;
if (!resolvedOposicionId && temaId) {
  const r = await pool.query('SELECT oposicion_id FROM temas WHERE id = $1', [temaId]);
  resolvedOposicionId = r.rows[0]?.oposicion_id ?? null;
}
```

**Escenarios cubiertos:**

| Caso | `tema_id` | `oposicion_id` del caller | Resultado en DB |
|---|---|---|---|
| Test de 1 tema sin oposición explícita | `N` | null | → se deriva de `temas` ✅ |
| Test de 1 tema con oposición explícita | `N` | `M` | → se usa `M` ✅ |
| Test multi-tema, misma oposición | null | `M` | → se usa `M` ✅ |
| Test multi-tema, distintas oposiciones | null | null | → null ✅ (correcto) |

**Backfill de datos existentes:** Se ejecutó SQL para corregir los 4 tests históricos con `oposicion_id = NULL`:

```sql
UPDATE tests
SET oposicion_id = (SELECT oposicion_id FROM temas WHERE temas.id = tests.tema_id)
WHERE oposicion_id IS NULL AND tema_id IS NOT NULL;
-- UPDATE 4
```

**Simplificación de `getTopOposiciones`:** Una vez garantizada la consistencia del dato, se eliminó la subconsulta `EXISTS` que compensaba el dato ausente. El join quedó como `t.oposicion_id = o.id`.

---

### Archivos adicionales modificados

| Archivo | Cambio |
|---|---|
| `backend/src/repositories/adminDashboardStats.repository.js` | Fix nota media, tests semana, actividad reciente, top oposiciones |
| `backend/src/repositories/testSessionWriteSetup.repository.js` | Derivación automática de `oposicion_id` |
| `frontend/src/pages/admin/AdminDashboardPage.jsx` | Fix dataKey evolución, badge dinámico, tooltip top oposiciones |
