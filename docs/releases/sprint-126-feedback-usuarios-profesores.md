# Sprint 126 — Selección de oposición activa al inicio de sesión

**Fecha de apertura:** 5 de mayo de 2026
**Tipo:** Feature UX — flujo post-login
**Estado:** 🟡 En implementación

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

## Notas de cierre

> Se completa al cerrar el sprint.
