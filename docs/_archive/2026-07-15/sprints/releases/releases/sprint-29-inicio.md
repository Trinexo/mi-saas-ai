# Sprint 29 — Navegación contextual en MarcadasPage

**Fecha de cierre:** 25 de marzo de 2026  
**Rama base:** main (`546a179` — PR #111)  
**Estado:** ✅ Mergeado a main

---

## Objetivo del sprint

Añadir navegación contextual completa a la página de preguntas marcadas (`MarcadasPage`): links desde cada tarjeta a su tema y oposición, y breadcrumb de posición global en el flujo de la app.

---

## PRs incluidos

### PR #112 — Backend: `getMarcadas` añade `temaId`, `oposicionId`, `oposicionNombre`

**Rama:** `sprint-29/pr-112-marcadas-backend`  
**Archivo:** `backend/src/repositories/marcadas.repository.js`

**Cambios:**
- Query `getMarcadas` ampliada con dos JOINs adicionales:
  - `JOIN materias m ON m.id = t.materia_id`
  - `JOIN oposiciones o ON o.id = m.oposicion_id`
- Campos añadidos al SELECT: `t.id AS tema_id`, `o.id AS oposicion_id`, `o.nombre AS oposicion_nombre`
- Objeto retornado añade: `temaId`, `oposicionId`, `oposicionNombre`

**Tests:** `node --test tests/services/marcadas.test.js` → 10/10 ✅

---

### PR #113 — Frontend: links tema y oposición en tarjetas de `MarcadasPage`

**Rama:** `sprint-29/pr-113-marcadas-links`  
**Archivo:** `frontend/src/pages/MarcadasPage.jsx`

**Cambios:**
- `temaNombre` plano → `<Link to="/tema/:temaId">` si existe `temaId`
- Añade `· <Link to="/oposicion/:oposicionId">{oposicionNombre}</Link>` con `color: #94a3b8`
- Mantiene `· {DIFICULTAD_LABEL}` al final de la línea de contexto

---

### PR #114 — Frontend: breadcrumb `Inicio › Marcadas` y ajuste link progreso

**Rama:** `sprint-29/pr-114-marcadas-breadcrumb`  
**Archivo:** `frontend/src/pages/MarcadasPage.jsx`

**Cambios:**
- Añade `<nav>` breadcrumb al inicio del `<section>`: `Inicio › Marcadas` (patrón consistente con TemaPage, OposicionPage, MateriaPage)
- `← Volver al progreso` → `Ver progreso →` con `fontSize: 13, color: #64748b`

---

## Patrón de navegación completado

Con este sprint, todas las páginas principales del área de estudio tienen breadcrumb y links contextuales:

| Página | Breadcrumb | Links en contenido |
|--------|-----------|-------------------|
| OposicionPage | `Inicio › Mis oposiciones` | — |
| MateriaPage | `Inicio › Mis oposiciones › {oposición}` | — |
| TemaPage | `Inicio › {oposición} › {materia}` | — |
| HistorialPage | — | oposición, tema |
| ReviewPage | — | oposición, tema |
| ProgressPage | — | materia |
| **MarcadasPage** | **`Inicio › Marcadas`** | **tema, oposición** |
