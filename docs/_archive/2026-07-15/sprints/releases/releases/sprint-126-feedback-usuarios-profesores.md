# Sprint 126 — Selección de oposición activa al inicio de sesión

**Fecha de apertura:** 5 de mayo de 2026
**Tipo:** Feature UX — flujo post-login
**Estado:** ✅ Cerrado

---

## Reporte de origen

**Procedencia:** Usuarios y profesores — pruebas de uso  
**Área:** Flujo de inicio de sesión / contexto de trabajo / configurador de tests  
**Prioridad:** Alta

> **Reporte 1** — "Al acceder con mis credenciales, quiero ver las oposiciones en las que estoy activo/a y elegir en cuál quiero trabajar. Si solo tengo una, que entre directamente. Una vez elegida, todos los datos (inicio, estadísticas, tests, simulacros, ranking, favoritos) deben mostrar solo lo de esa oposición."

> **Reporte 2** — "En el configurador de test, para práctica y simulacro, no quiero tener que elegir el tipo de oposición porque ya la tengo activa. En el catálogo sí que se debe poder adquirir y realizar tests de prueba de otros cursos."

---

## Diseño de la solución

### Flujo

```
Login exitoso
    ↓
¿Cuántos accesos activos tiene el usuario?
    ├─ 0 → /catalogo  (sin oposiciones contratadas)
    ├─ 1 → auto-selecciona y va a /  (sin pantalla intermedia)
    └─ >1 → /seleccionar-oposicion
                ↓
           Elige una oposición
                ↓
                /
```

### Estado global: `OposicionActivaContext`

- Fichero: `frontend/src/state/oposicionActiva.jsx`
- Persiste en `localStorage` bajo la clave `oposicionActiva`
- Se limpia al hacer logout
- Expone: `oposicionActiva` (`{ id, nombre }` | `null`), `setOposicionActiva`, `clearOposicionActiva`

### Guard en `ProtectedRoute`

- Solo aplica a usuarios con rol `alumno` (no a admin/profesor)
- Si `oposicionActiva === null`:
  - `accesos.length === 0` → redirige a `/catalogo`
  - `accesos.length === 1` → auto-selecciona y continúa
  - `accesos.length > 1` → redirige a `/seleccionar-oposicion`
- Si `oposicionActiva !== null` → continúa normal

### Páginas con filtro por oposición activa

| Página | Cambio |
|---|---|
| `HomePage` | Muestra badge de oposición activa; las KPIs ya son globales por usuario |
| `HistorialPage` | Pre-rellena el filtro `oposicionId` con la oposición activa |
| `SimulacrosPage` | Filtra la lista para mostrar solo la oposición activa |
| `ProgressPage` | Pasa `oposicionId` a `getProgresoTemas` y similar |
| `RankingPage` | Muestra badge de oposición activa seleccionada |
| `MarcadasPage` | Sin cambio necesario (filtra por usuario, no por oposición) |

---

## Backlog del sprint

| # | Tarea | Área | PR |
|---|---|---|---|
| 1 | `getAccesosActivos` devuelve `nombre` de oposición | Backend (repositorio) | PR #A |
| 2 | `OposicionActivaContext` | Frontend (state) | PR #B |
| 3 | `SeleccionarOposicionPage` | Frontend (página) | PR #C |
| 4 | Guard y nueva ruta en `App.jsx` | Frontend (routing) | PR #D |
| 5 | `HomePage`: badge oposición activa | Frontend (página) | PR #E |
| 6 | `HistorialPage`: pre-rellena filtro oposición | Frontend (página) | PR #E |
| 7 | `SimulacrosPage`: filtra por oposición activa | Frontend (página) | PR #E |
| 8 | `ProgressPage`: pasa `oposicionId` a stats | Frontend (página) | PR #E |
| 9 | `RankingPage`: badge oposición activa | Frontend (página) | PR #E |
| 10 | `auth.jsx` limpia oposición activa en logout | Frontend (state) | PR #B |
| 11 | `GenerarTestForm`: badge oposición activa, sin selector | Frontend (form) | PR #F |
| 12 | `SimulacroForm`: badge oposición activa, sin selector | Frontend (form) | PR #F |

---

## PRs incluidos

### PR #A — Backend: `getAccesosActivos` devuelve nombre de oposición

**Rama:** `sprint-126/pr-A-accesos-con-nombre`  
**Archivo:** `backend/src/repositories/accesoOposicion.repository.js`

**Cambio:** JOIN con `oposiciones` para incluir `nombre` y opcionalmente `descripcion` en cada acceso.  
**Respuesta anterior:** `[{ oposicion_id, fecha_fin }]`  
**Respuesta nueva:** `[{ oposicion_id, nombre, fecha_fin }]`

---

### PR #B — Frontend: `OposicionActivaContext` + limpieza en logout

**Rama:** `sprint-126/pr-B-oposicion-activa-context`  
**Archivos:**
- `frontend/src/state/oposicionActiva.jsx` — nuevo contexto
- `frontend/src/state/auth.jsx` — `logout` llama a `clearOposicionActiva`

---

### PR #C — Frontend: `SeleccionarOposicionPage`

**Rama:** `sprint-126/pr-C-seleccionar-oposicion-page`  
**Archivo:** `frontend/src/pages/SeleccionarOposicionPage.jsx`

Pantalla de bienvenida con tarjetas por cada oposición activa del usuario. Al seleccionar, guarda en contexto y navega a `/`.

---

### PR #D — Frontend: guard post-login y nueva ruta en `App.jsx`

**Rama:** `sprint-126/pr-D-guard-routing`  
**Archivo:** `frontend/src/App.jsx`

- Envuelve la app con `OposicionActivaProvider`
- `ProtectedRoute` añade lógica de redirección según número de accesos
- Añade ruta `/seleccionar-oposicion`

---

### PR #E — Frontend: páginas filtran por oposición activa

**Rama:** `sprint-126/pr-E-paginas-filtro-oposicion`  
**Archivos:** `HomePage.jsx`, `HistorialPage.jsx`, `SimulacrosPage.jsx`, `ProgressPage.jsx`, `RankingPage.jsx`

---

### PR #F — Frontend: configurador sin selector de oposición cuando hay activa

**Rama:** `sprint-126/pr-F-configurador-oposicion-activa`  
**Archivos:**
- `frontend/src/components/forms/GenerarTestForm.jsx`
- `frontend/src/components/forms/SimulacroForm.jsx`

**Cambio:** Cuando `oposicionActiva` tiene valor, ambos formularios:
- Auto-seleccionan el `oposicionId` al montar
- Reemplazan el `<select>` de oposición por un badge de solo lectura (naranja, estilo consistente con el resto de la app)
- `GenerarTestForm` carga las materias de la oposición activa automáticamente al montar
- `SimulacroForm` carga el tiempo límite oficial de la oposición activa automáticamente

Cuando **no** hay `oposicionActiva` (caso catálogo, usuarios sin contexto), ambos formularios siguen mostrando el selector completo con acceso a todas las oposiciones.

---

## Cambios en documentación

| Documento | Tipo de cambio | Motivo |
|---|---|---|
| `docs/05-diseno-ux-plataforma.md` | Actualizar | Añadir flujo post-login con selección de oposición |
| `docs/api-v1.md` | Actualizar | Documentar nuevo campo `nombre` en `GET /accesos/mis-oposiciones` |

---

---

## Reporte #4 — Renombrado jerarquía catálogo: materias → temas, temas → bloques [P0]

**Procedencia:** Usuarios y profesores — pruebas de uso  
**Área:** Banco de preguntas / catálogo / estadísticas / admin  
**Prioridad:** Alta (rompe inconsistencia nomenclatura en toda la plataforma)

> **Feedback:** La nomenclatura anterior ("materias" encima de "temas") era confusa e inversa a la usada en las convocatorias reales. La nueva jerarquía **oposición → temas → bloques** es directamente reconocible por los opositores.

### Cambios en base de datos

- Tabla `materias` renombrada a `temas` (FK `oposicion_id` sin cambio)
- Tabla `temas` renombrada a `bloques` (FK `materia_id → tema_id`)
- `preguntas.tema_id → preguntas.bloque_id`
- `progreso_usuario.tema_id → progreso_usuario.bloque_id`
- `tests.tema_id → tests.bloque_id`
- Migration: `database/migrations/019_rename_materias_temas_to_temas_bloques.sql`

### Archivos modificados (~50 archivos)

**Base de datos**
- `database/migrations/019_rename_materias_temas_to_temas_bloques.sql`
- `database/schema.sql`, `database/seed.sql`

**Backend — Repositorios**
- `catalog.repository.js`, `catalogAdmin.repository.js`
- `adminPreguntasListadoBrowse.repository.js`, `adminPreguntasEntityRead.repository.js`
- `adminDashboardStats.repository.js`, `profesorDashboard.repository.js`
- `progressGeneralEvolucion.repository.js`, `progressTemarioDetalleBrowse.repository.js`
- `testRecomendado.repository.js`, `widgetEngagementRachaStreaks.repository.js`
- `widgetEngagementFocoSesion.repository.js`, `testSessionWriteSetup.repository.js`

**Backend — Servicios**
- `catalogHierarchy.service.js`, `catalogPreguntas.service.js`
- `catalogAdminTaxonomia.service.js`, `adminPreguntasCrudReadListPreguntas.service.js`
- `statsProgresoDetalleTema.service.js`, `testRecomendado.service.js`

**Backend — Controladores**
- `catalog.controller.js`, `catalogAdmin.controller.js`
- `adminPanel.controller.js`, `statsProgresoTema.controller.js`
- `statsProgresoOposicion.controller.js`

**Backend — Schemas**
- `catalog.schema.js`, `catalogAdmin.schema.js`
- `admin.schema.js`, `stats.schema.js`

**Backend — Rutas**
- `catalog.routes.js`, `adminCatalogo.routes.js`
- `adminGestion.routes.js`, `stats.routes.js`
  - `GET /stats/tema` → `GET /stats/bloque`
  - `GET /stats/progreso-temas-materia` → `GET /stats/progreso-bloques-tema`
  - `GET /stats/tema/:id/detalle` → `GET /stats/bloque/:id/detalle`

**Frontend — Servicios API**
- `catalogApi.js`, `adminApi.js`, `testApi.js`

**Frontend — Componentes**
- `OposicionMateriasTable.jsx`, `MateriaTemasTable.jsx`
- `TemasDebilesWidget.jsx`, `EstadisticasPorTemaSection.jsx`

**Frontend — Páginas**
- `MateriaPage.jsx` (ahora sirve ruta `/tema/:id`)
- `TemaPage.jsx` (ahora sirve ruta `/bloque/:id`)
- `AdminCatalogPage.jsx`, `AdminQuestionsPage.jsx`

**Frontend — Routing**
- `App.jsx`: `materia/:id → tema/:id`, `tema/:id → bloque/:id`

---

---

## Reporte #5 — Errores 500 en endpoints admin tras migración 019 [Hotfix]

**Procedencia:** Pruebas de integración post-rename  
**Área:** Backend / Base de datos  
**Prioridad:** Crítica (bloqueante en panel admin)

> **Problema:** Los endpoints `/admin/stats/contenido`, `/admin/stats/top-oposiciones`, `/admin/actividad` y `/admin/preguntas` devolvían HTTP 500 porque el código ya usaba `temas`/`bloques`/`bloque_id` pero la base de datos aún tenía `materias`/`temas`/`tema_id`.

### Causa raíz

La migración `019_rename_materias_temas_to_temas_bloques.sql` no había sido aplicada al entorno de desarrollo local.

### Solución aplicada

```powershell
$env:PGPASSWORD='postgres'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d plataforma_test -h localhost `
  -f "database/migrations/019_rename_materias_temas_to_temas_bloques.sql"
```

### Verificación post-migración

- Tabla `bloques` existe (era `temas`) ✅
- Tabla `temas` existe (era `materias`) ✅
- `preguntas.bloque_id` existe (era `tema_id`) ✅
- `progreso_usuario.bloque_id` existe (era `tema_id`) ✅
- `tests.bloque_id` existe (era `tema_id`) ✅

### Archivos afectados

- `database/migrations/019_rename_materias_temas_to_temas_bloques.sql` — debe ejecutarse en producción/staging antes del deploy del Reporte #4

---

## Reporte #6 — Split AdminQuestionsPage: separar creación de listado [UX Admin]

**Procedencia:** Feedback profesores — página `/admin/preguntas` demasiado densa  
**Área:** Frontend / Panel de administración  
**Prioridad:** Media

> **Feedback:** La página `/admin/preguntas` tenía todo en una sola pantalla (lista, edición inline, creación, CSV, reportes, auditoría — 841 líneas). Se solicitó separar la creación e importación en una página aparte.

### Diseño

| Ruta | Página | Contenido |
|---|---|---|
| `/admin/preguntas` | `AdminQuestionsPage.jsx` | Lista + filtros + edición inline + moderación reportes + auditoría |
| `/admin/preguntas/nueva` | `AdminNuevaPreguntaPage.jsx` | Formulario creación + importador CSV |

### Flujo de navegación

- Botón **"+ Nueva pregunta"** en `/admin/preguntas` → navega a `/admin/preguntas/nueva`
- Botón **"← Volver a preguntas"** en `/admin/preguntas/nueva` → navega a `/admin/preguntas`

### Archivos creados / modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/pages/admin/AdminNuevaPreguntaPage.jsx` | Nuevo | Formulario creación + CSV import |
| `frontend/src/pages/admin/AdminQuestionsPage.jsx` | Modificado | Elimina sección creación y CSV; botón navega a `/nueva`; formulario edición solo aparece cuando `editingId !== null` |
| `frontend/src/App.jsx` | Modificado | Import `AdminNuevaPreguntaPage`; añade ruta `preguntas/nueva` antes de `preguntas` bajo el bloque `admin` |

---

---

## Reporte #7 — Imagen adjunta en enunciado de preguntas [Feedback profesores]

**Procedencia:** Feedback profesores — pruebas de uso  
**Área:** Backend / Frontend / Panel de administración / Flujo de test  
**Prioridad:** Media

> **Feedback:** Los profesores solicitaron poder adjuntar una imagen al enunciado de una pregunta (diagramas, mapas, gráficas, extractos normativos) para enriquecer el banco de preguntas. La imagen debe mostrarse encima del enunciado tanto durante el test como en la revisión posterior.

### Diseño de la solución

- Las imágenes se suben al endpoint `POST /api/admin/preguntas/:id/imagen`, se procesan con **Sharp** (WebP, calidad 75, máx 1200 px) y se almacenan en `backend/uploads/preguntas/{id}.webp`
- Se sirven estáticamente bajo `/uploads/preguntas/{id}.webp`
- El campo `imagen_url` (tipo `TEXT`) se añade a la tabla `preguntas`
- La subida es independiente del guardado del formulario de texto (se sube en el momento de seleccionar el fichero)
- Para eliminar la imagen: `DELETE /api/admin/preguntas/:id/imagen`

### Archivos creados / modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `database/migrations/020_add_imagen_url_to_preguntas.sql` | Nuevo | `ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS imagen_url TEXT` |
| `backend/src/services/uploadImagen.service.js` | Nuevo | Procesa imagen con Sharp → WebP, guarda en disco, devuelve URL relativa |
| `backend/src/controllers/adminImagenPregunta.controller.js` | Nuevo | Handlers `uploadImagenPregunta` y `deleteImagenPregunta` |
| `backend/src/routes/v1/adminGestion.routes.js` | Modificado | Rutas `POST` y `DELETE` `/preguntas/:id/imagen` |
| `backend/src/app.js` | Modificado | Sirve `/uploads` como estático con `express.static` |
| `backend/src/repositories/adminPreguntasEntityRead.repository.js` | Modificado | `getFullPreguntaById` incluye `p.imagen_url` en SELECT |
| `backend/src/repositories/adminPreguntasEntityWrite.repository.js` | Modificado | INSERT y UPDATE incluyen `imagen_url` |
| `backend/src/schemas/admin.schema.js` | Modificado | `basePreguntaSchema` añade `imagenUrl` optional/nullable |
| `backend/src/repositories/testQuestionsTheme.repository.js` | Modificado | `p.imagen_url` en todos los SELECT |
| `backend/src/repositories/testQuestionsAdaptive.repository.js` | Modificado | `p.imagen_url` en SELECT |
| `backend/src/repositories/testQuestionsSpecial.repository.js` | Modificado | `p.imagen_url` en todos los SELECT |
| `backend/src/repositories/testSessionDetailConfig.repository.js` | Modificado | `imagen_url` en `json_build_object` de preguntas |
| `backend/src/repositories/testSessionDetailReview.repository.js` | Modificado | `p.imagen_url` en SELECT y mapeado en respuesta |
| `frontend/src/services/adminApi.js` | Modificado | Métodos `uploadImagenPregunta` y `deleteImagenPregunta` |
| `frontend/src/pages/admin/AdminQuestionsPage.jsx` | Modificado | Sección de imagen en formulario edición (preview + subir + eliminar) |
| `frontend/src/components/test/TestPregunta.jsx` | Modificado | Renderiza `<img>` encima del enunciado si `imagen_url` presente |
| `frontend/src/components/review/ReviewPreguntaCard.jsx` | Modificado | Renderiza `<img>` encima del enunciado si `imagen_url` presente |

### Restricciones MVP

- Formatos aceptados: JPEG, PNG, WebP
- La imagen **solo se puede subir al editar** una pregunta existente (requiere `preguntaId`)
- El almacenamiento es local (`backend/uploads/`) — en producción Railway el filesystem es efímero; para producción a largo plazo migrar a almacenamiento externo (Cloudflare R2, Supabase Storage)

---

## Reporte #8 — Audio adjunto en preguntas [Feedback profesores]

**Procedencia:** Feedback profesores — pruebas de uso  
**Área:** Backend / Frontend / Panel de administración / Flujo de test  
**Prioridad:** Media

> **Feedback:** Además de imágenes, se solicitó poder adjuntar audio a una pregunta para casos de comprensión oral, dictados, pruebas con locuciones o materiales auditivos.

### Diseño de la solución

- Se añade el campo `audio_url` a `preguntas`.
- Los audios se suben desde el panel de administración y se almacenan bajo `backend/uploads/audios`.
- El backend expone endpoints de subida y eliminación de audio por pregunta.
- El frontend incorpora controles de gestión de audio en la edición de preguntas.

### Archivos creados / modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `database/migrations/021_add_audio_url_to_preguntas.sql` | Nuevo | Añade `audio_url` a `preguntas` |
| `backend/src/services/uploadAudio.service.js` | Nuevo | Gestión de subida/almacenamiento de audio |
| `backend/src/controllers/adminAudioPregunta.controller.js` | Nuevo | Handlers de subida y eliminación |
| `backend/src/routes/v1/adminGestion.routes.js` | Modificado | Rutas admin para audio de preguntas |
| `frontend/src/services/adminApi.js` | Modificado | Métodos de subida/eliminación/browser de audio |
| `frontend/src/pages/admin/AdminQuestionsPage.jsx` | Modificado | UI de audio en edición de pregunta |

---

## Reporte #9 — Colecciones personalizadas en preguntas [UX Admin]

**Procedencia:** Feedback profesores — organización del banco de preguntas  
**Área:** Base de datos / Backend / Frontend admin  
**Prioridad:** Media

> **Feedback:** Los profesores necesitaban agrupar preguntas en colecciones propias además de la jerarquía oficial de oposición, tema y bloque.

### Diseño de la solución

- Se crea soporte de colecciones personalizadas para organizar preguntas.
- Se añaden endpoints/repositorios para consultar y persistir la relación.
- El panel admin incorpora componentes específicos dentro de `frontend/src/components/admin`.

### Archivos creados / modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `database/migrations/022_colecciones_personalizadas.sql` | Nuevo | Estructura de colecciones personalizadas |
| `backend/src/repositories/adminPreguntasListadoBrowse.repository.js` | Modificado | Filtros/consulta con colecciones |
| `backend/src/repositories/adminPreguntasEntityRead.repository.js` | Modificado | Lectura de datos asociados |
| `backend/src/repositories/adminPreguntasEntityWrite.repository.js` | Modificado | Persistencia de relaciones |
| `backend/src/services/adminPreguntasImport*.service.js` | Modificado | Importación alineada con nuevas relaciones |
| `frontend/src/components/admin/` | Nuevo | Componentes admin reutilizables |
| `frontend/src/pages/admin/AdminQuestionsPage.jsx` | Modificado | Integración visual en el flujo de preguntas |

---

## Reporte #10 — Editor visual de tests administrados [Nueva funcionalidad]

**Procedencia:** Propuesta visual para creación/edición dinámica de tests  
**Área:** Backend / Frontend admin / Base de datos  
**Prioridad:** Alta

> **Objetivo:** Crear una pantalla más visual y dinámica para construir tests reutilizables, asociarlos a oposición/tema, configurar reglas y gestionar preguntas existentes del banco global.

### Diseño de la solución

- Nueva entidad `admin_tests` para distinguir tests curados por admin/profesor de las sesiones de test realizadas por usuarios.
- Relación N:M ordenada entre tests y preguntas mediante `admin_tests_preguntas`.
- Editor full-page con:
  - Información general
  - Configuración del test
  - Resumen lateral
  - Tabla de preguntas asociadas
  - Modal de selección múltiple de preguntas existentes
- El listado `/admin/tests` permite crear tests y editar tests existentes.

### Archivos creados / modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `database/migrations/023_admin_tests.sql` | Nuevo | Crea `admin_tests` y `admin_tests_preguntas` |
| `database/migrations/024_drop_admin_tests_etiquetas.sql` | Nuevo | Elimina la relación de etiquetas específica de tests |
| `backend/src/repositories/adminTests.repository.js` | Nuevo | Persistencia/listado/detalle/asignación de preguntas |
| `backend/src/services/adminTests.service.js` | Nuevo | Reglas de negocio y validaciones |
| `backend/src/controllers/adminTests.controller.js` | Nuevo | Handlers REST |
| `backend/src/routes/v1/adminTests.routes.js` | Nuevo | Rutas `/api/admin/tests` |
| `backend/src/routes/v1/admin.routes.js` | Modificado | Registra `/tests` |
| `frontend/src/pages/admin/AdminEditTestPage.jsx` | Nuevo | Editor visual full-page de tests |
| `frontend/src/pages/admin/AdminTestsPage.jsx` | Modificado | Botones de nuevo/editar conectados al editor |
| `frontend/src/services/adminApi.js` | Modificado | Métodos `listTests`, `getTest`, `createTest`, `updateTest`, `addPreguntasTest`, etc. |
| `frontend/src/App.jsx` | Modificado | Rutas `/admin/tests/nuevo` y `/admin/tests/:id/editar` |

### Migración aplicada

Durante la aplicación local se detectó que `023_admin_tests.sql` dependía de `etiquetas`, que aún no existía en la base actual. Se aplicó primero la dependencia mínima:

- `database/migrations/016_add_etiquetas.sql`
- `database/migrations/023_admin_tests.sql`

### Verificación

- `admin_tests` y `admin_tests_preguntas` creadas correctamente.
- Import de rutas backend `adminTests` correcto.
- Build frontend correcto con Vite.

### Ajuste posterior

- Se retira el selector de etiquetas de tests y cualquier sincronización backend asociada.
- El sistema general de etiquetas para preguntas se mantiene.

---

## Reporte #11 — Wizard visual de simulacros [Nueva funcionalidad]

**Procedencia:** Propuesta visual para creación guiada de simulacros oficiales  
**Área:** Frontend admin / Backend simulacros  
**Prioridad:** Alta

> **Objetivo:** Convertir la creación de simulacros en un flujo guiado por pasos, más claro para profesores y administradores.

### Diseño de la solución

- Nuevo wizard de 5 pasos:
  1. Información general
  2. Estructura y bloques
  3. Selección de preguntas
  4. Configuración
  5. Publicación
- Persistencia parcial: el simulacro se crea al completar el paso 1 y los pasos posteriores trabajan sobre ese ID.
- Gestión visual de bloques con número de preguntas planificadas.
- Gestión de preguntas por bloque con modal de selección múltiple.
- Resumen lateral vivo con oposición, bloques, preguntas planificadas/asignadas, tiempo, puntuación y estado.

### Ajustes técnicos

- `numero_preguntas` en `simulacros_bloques` se usa como número planificado de preguntas del bloque.
- Se evita sobrescribir `numero_preguntas` al asignar/quitar preguntas, para que el progreso del wizard conserve el objetivo planificado.
- Se añade soporte backend para crear/actualizar `numero_preguntas` en bloques.
- La fecha programada se envía como ISO string compatible con la validación backend.

### Archivos creados / modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/pages/admin/AdminSimulacroWizardPage.jsx` | Nuevo | Wizard visual de simulacros |
| `frontend/src/pages/admin/AdminSimulacrosPage.jsx` | Modificado | Botones nuevo/editar conectados al wizard |
| `frontend/src/App.jsx` | Modificado | Rutas `/admin/simulacros/nuevo` y `/admin/simulacros/:id/editar` |
| `frontend/src/services/adminApi.js` | Modificado | Métodos para bloques y preguntas de simulacros |
| `backend/src/schemas/adminSimulacros.schema.js` | Modificado | `numero_preguntas` en create/update de bloques |
| `backend/src/controllers/adminSimulacros.controller.js` | Modificado | Envía payload completo de bloque al service |
| `backend/src/services/adminSimulacros.service.js` | Modificado | Crea bloques con payload completo |
| `backend/src/repositories/adminSimulacros.repository.js` | Modificado | Inserta/actualiza `numero_preguntas`; conserva planificación al asignar preguntas |

### Verificación

- Build frontend correcto con Vite.
- Import de rutas backend de `adminSimulacros` correcto.

---

## Reporte #12 — Ajustes UX finales en creación de tests y simulacros [Ajuste]

**Procedencia:** Revisión de uso en panel de administración  
**Área:** Frontend admin / Catálogo admin / Documentación de sprint  
**Prioridad:** Alta

> **Feedback:** En las pantallas nuevas de creación de tests y simulacros debían cargarse correctamente las oposiciones existentes, eliminarse las etiquetas que no aportaban valor al flujo, mantener el ancho completo del panel admin y ajustar el editor de test al diseño visual de cards propuesto.

### Cambios aplicados

- El editor `/admin/tests/nuevo` y `/admin/tests/:id/editar` queda distribuido como:
  - Card `Información general`
  - Card `Configuración del test`
  - Card `Resumen del test`
  - Card inferior a ancho completo `Preguntas del test`
- Se mantienen fuera las etiquetas específicas de tests/simulacros.
- Los selectores de oposición en creación de tests y simulacros cargan desde el catálogo admin con `page_size` válido y fallback al catálogo público si el endpoint admin no responde.
- Las pantallas admin de simulacros, creación de simulacros y edición/creación de tests pasan a ancho completo en escritorio.
- Se corrige texto visible con codificación incorrecta en el buscador/listado de simulacros.
- Se refuerza backend para que el rol `profesor` solo pueda generar, crear, editar o consultar tests/simulacros asociados a oposiciones presentes en `profesores_oposiciones`.
- Se corrige el uso de `req.user.id` por `req.user.userId` en controladores de profesor y preguntas admin para que las asignaciones reales del JWT se apliquen correctamente.
- Los selectores de oposición usados por profesores en creación/edición de tests y simulacros cargan únicamente `/profesor/mis-oposiciones`; si solo hay una oposición asignada, se selecciona por defecto.
- El contexto global de revision deja de consultar `/api/admin/reportes` para profesores, evitando el 403 en el panel de profesor.
- El dashboard de profesor usa la tabla real `auditoria_preguntas`, corrigiendo el 500 de `/api/profesor/dashboard`.
- Se activan las future flags de React Router v7 para eliminar los avisos de deprecacion en desarrollo.
- El panel `/profesor` muestra todos los enlaces principales del rol: Dashboard, Preguntas, Tests y Simulacros. El perfil queda accesible desde el avatar/nombre de usuario.
- Las pantallas visuales de Tests y Simulacros quedan disponibles tambien bajo rutas `/profesor/tests` y `/profesor/simulacros`, reutilizando los filtros por oposiciones asignadas.
- Se revisa el flujo existente de reportes de preguntas: alumnos envian reportes desde test/revision, admin los gestiona en `/admin/revision` y al resolver/descartar se genera una notificacion para el usuario que reporto.
- Se habilitan notificaciones tambien para profesores mediante `/profesor/notificaciones` y el icono de campana del bloque de usuario.
- Se habilita la pagina de revision para profesores en `/profesor/revision`.
- Los reportes visibles para profesores se filtran en backend por las oposiciones asignadas en `profesores_oposiciones`.
- La actualizacion de estado de un reporte por parte de profesor valida que el reporte pertenezca a una de sus oposiciones asignadas antes de resolver o descartar.
- Se añade migracion idempotente para `notificaciones`, ya que el codigo la usaba pero la tabla no estaba garantizada en `schema.sql`/migraciones.
- Se limpian textos visibles y mensajes backend del modulo de notificaciones para evitar mojibake.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/src/pages/admin/AdminEditTestPage.jsx` | Layout final de cards, resumen lateral y tabla de preguntas full-width |
| `frontend/src/pages/admin/AdminSimulacroWizardPage.jsx` | Carga robusta de oposiciones y ancho completo |
| `frontend/src/pages/admin/AdminSimulacrosPage.jsx` | Ancho completo y corrección de textos UTF-8 |
| `frontend/src/services/adminApi.js` | Parámetros compatibles con límite backend de catálogo |
| `backend/src/controllers/catalog.controller.js` / repositorios catálogo | Compatibilidad con columnas requeridas por el catálogo admin |
| `backend/src/middleware/acceso.middleware.js` | Bloquea a profesores en tests/simulacros fuera de sus oposiciones asignadas |
| `backend/src/repositories/profesorAccess.repository.js` | Nuevo helper de asignaciones profesor-oposición y validación de preguntas/bloques |
| `backend/src/services/adminTests.service.js` / `adminSimulacros.service.js` | Filtros y guardas por oposiciones asignadas para rol profesor |
| `backend/src/services/profesorSimulacros.service.js` | Validación estricta de oposición asignada y pertenencia de bloques/preguntas |
| `frontend/src/pages/admin/AdminEditTestPage.jsx` / `AdminSimulacroWizardPage.jsx` | Selectores acotados a oposiciones asignadas para profesores |
| `frontend/src/pages/admin/AdminTestsPage.jsx` | Lista de oposiciones acotada y autoselección si el profesor solo tiene una |
| `frontend/src/pages/profesor/ProfesorSimulacrosPage.jsx` | Selector de oposición asignada en lugar de campo manual de ID |
| `frontend/src/state/revisionContext.jsx` | Evita llamadas admin de reportes cuando el usuario no es admin |
| `frontend/src/main.jsx` | Activa future flags de React Router v7 |
| `backend/src/repositories/profesorDashboard.repository.js` | Corrige consultas del dashboard contra `auditoria_preguntas` |
| `frontend/src/components/MainLayout.jsx` | Muestra navegacion completa del profesor y mantiene el perfil accesible desde el avatar |
| `frontend/src/App.jsx` | Expone rutas de Tests, Simulacros y Perfil dentro del namespace `/profesor` |
| `frontend/src/pages/admin/AdminRevisionPage.jsx` | Reutiliza la pagina de revision con texto contextual para profesor |
| `frontend/src/pages/admin/AdminTestsPage.jsx` / `AdminEditTestPage.jsx` | Adaptan navegacion interna a `/profesor/tests` cuando el rol es profesor |
| `frontend/src/pages/admin/AdminSimulacrosPage.jsx` / `AdminSimulacroWizardPage.jsx` | Adaptan navegacion interna a `/profesor/simulacros` cuando el rol es profesor |
| `backend/src/routes/v1/adminGestion.routes.js` | Permite reportes a `admin` y `profesor` |
| `backend/src/controllers/adminPanel.controller.js` | Pasa el usuario autenticado al servicio de reportes |
| `backend/src/services/adminPanelReportesLista.service.js` / `adminPanelReportesEstado.service.js` | Filtra y valida reportes por oposiciones asignadas para profesor |
| `backend/src/repositories/adminReportesPreguntas.repository.js` | Añade filtro por `oposicionIds` en listado, conteo y detalle de reportes |
| `frontend/src/pages/NotificacionesPage.jsx` | Pantalla de notificaciones compartida por alumno y profesor, con textos saneados |
| `backend/src/services/notificaciones.service.js` / `controllers/notificaciones.controller.js` | Mensajes limpios al crear y marcar notificaciones |
| `database/migrations/025_add_notificaciones.sql` | Crea tabla e indices de notificaciones |
| `database/schema.sql` | Incluye tabla e indices de notificaciones en el esquema base |
| `database/migrations/014_add_categoria_estado_to_oposiciones.sql` | Aplicada para soportar `categoria` y `estado` en oposiciones |
| `database/migrations/024_drop_admin_tests_etiquetas.sql` | Aplicada para retirar relación de etiquetas específica de tests |

### Verificación

- `/admin/tests/nuevo` muestra oposiciones en el selector.
- `/admin/simulacros/nuevo` muestra oposiciones en el selector.
- Los profesores reciben 403 si intentan usar una oposición o bloque no asignado.
- `/api/profesor/dashboard` devuelve respuesta correcta con oposiciones, estadisticas y actividad.
- Profesores ya no lanzan peticiones a `/api/admin/reportes` desde `RevisionProvider`.
- `/profesor` muestra enlaces a Preguntas, Tests y Simulacros; el Perfil se abre desde el avatar/nombre.
- `/profesor/revision` carga la pagina de revision de reportes para profesor.
- `adminService.listReportes(..., { role: 'profesor', userId })` responde solo con reportes filtrados por oposiciones asignadas.
- `/profesor/tests/nuevo` y `/profesor/simulacros/nuevo` compilan correctamente dentro del flujo de profesor.
- Migracion `025_add_notificaciones.sql` aplicada correctamente en local.
- `notificacionesService.countNoLeidas(1)` responde correctamente contra la tabla real.
- Suite backend `npm.cmd test -- --runInBand` correcta tras ejecutarla fuera del sandbox.
- `npm.cmd run build` en frontend finaliza correctamente.
- Queda solo el warning no bloqueante de Vite por tamaño de bundle.

---

### Ajuste adicional - Creacion de preguntas por profesor

- Se anade el boton `+ Nueva pregunta` en `/profesor/preguntas`.
- Se expone la ruta `/profesor/preguntas/nueva`, reutilizando el formulario de creacion de preguntas.
- El formulario, cuando lo usa un profesor, carga solo `/profesor/mis-oposiciones` y autoselecciona la unica oposicion asignada si corresponde.
- El importador CSV tambien queda disponible para profesor en `/profesor/preguntas/nueva`.
- La importacion CSV de profesor valida cada `tema_id` contra sus oposiciones asignadas antes de insertar.
- La guarda backend de creacion manual de preguntas por profesor valida `temaId` contra sus oposiciones asignadas.
- Se corrige el 403 del banco de imagenes/audios para profesor reordenando routers admin: el catalogo admin ya no intercepta `/admin/media/*`.
- El banco de imagenes/audios usa `preguntas.tema_id` y filtra por oposiciones asignadas para profesor.

| Archivo | Cambio |
|---|---|
| `frontend/src/pages/profesor/ProfesorPreguntasPage.jsx` | Boton de creacion en el listado del profesor |
| `frontend/src/App.jsx` | Ruta `/profesor/preguntas/nueva` |
| `frontend/src/pages/admin/AdminNuevaPreguntaPage.jsx` | Formulario compartido adaptado al rol profesor |
| `frontend/src/services/profesorApi.js` | Metodo de importacion CSV para profesor |
| `backend/src/routes/v1/adminGestion.routes.js` | Permite importacion CSV a admin y profesor autenticados |
| `backend/src/controllers/adminPreguntasCommand.controller.js` | Pasa el usuario autenticado al servicio de importacion |
| `backend/src/services/adminPreguntasImport.service.js` / `adminPreguntasImportPersist.service.js` | Validacion por oposiciones asignadas en importacion CSV |
| `backend/src/services/adminPreguntasCrudWriteMutationCreate.service.js` | Validacion de pertenencia usando `temaId` |
| `backend/src/routes/v1/admin.routes.js` | Reordena routers para no bloquear rutas profesor con catalogo admin |
| `backend/src/controllers/adminImagenPregunta.controller.js` / `adminAudioPregunta.controller.js` | Banco de medios/audio filtrado y protegido por oposicion asignada |

### Verificacion adicional

- `npm.cmd run build` en frontend correcto.
- `npm.cmd test -- --runInBand` en backend correcto, 183 tests pasando.

### Ajuste adicional - Perfil profesor analitico

- Se rediseña `/profesor` como dashboard academico con KPIs, grafico de evolucion, feed de actividad, oposiciones asignadas y alertas inteligentes.
- Se amplia la navegacion del profesor: Dashboard, Mis oposiciones, Temario, Tests, Simulacros, Preguntas, Alumnos, Estadisticas, Calendario, Revision y Notificaciones.
- Se añaden vistas nuevas para `/profesor/oposiciones`, `/profesor/oposiciones/:id`, `/profesor/temario`, `/profesor/alumnos`, `/profesor/estadisticas` y `/profesor/calendario`.
- El banco de preguntas del profesor se adapta a una vista analitica con KPIs, filtros, dificultad, uso estimado, tasa de aciertos y reportes.
- Se crea una capa compartida de UI/datos para el workspace profesor; usa datos reales existentes y metricas derivadas mientras no exista tracking profundo por alumno/bloque/simulacro.

| Archivo | Cambio |
|---|---|
| `frontend/src/pages/profesor/ProfesorDashboardPage.jsx` | Dashboard visual analitico con Recharts |
| `frontend/src/pages/profesor/ProfesorOposicionesPage.jsx` | Grid de workspaces/oposiciones asignadas |
| `frontend/src/pages/profesor/ProfesorOposicionDetallePage.jsx` | Detalle academico por oposicion |
| `frontend/src/pages/profesor/ProfesorEstadisticasPage.jsx` | Panel de estadisticas, ranking y preguntas problematicas |
| `frontend/src/pages/profesor/ProfesorAlumnosPage.jsx` | Seguimiento visual de alumnos |
| `frontend/src/pages/profesor/ProfesorCalendarioPage.jsx` | Calendario academico visual |
| `frontend/src/pages/profesor/ProfesorTemarioPage.jsx` | Entrada academica a contenido por oposicion |
| `frontend/src/pages/profesor/ProfesorPreguntasPage.jsx` | Banco de preguntas visual y analitico |
| `frontend/src/pages/profesor/ProfesorSharedUI.jsx` / `profesorWorkspaceData.js` | Componentes y normalizacion de datos compartidos |
| `frontend/src/components/MainLayout.jsx` / `frontend/src/App.jsx` | Menu y rutas completas del perfil profesor |

- `npm.cmd run build` en frontend correcto tras el rediseño.

## Notas de cierre

> Se completa al cerrar el sprint.
