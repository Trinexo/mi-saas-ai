# Sprint 27 — Inicio

Fecha: 25 de marzo de 2026
Estado: completado

## Objetivo del sprint
Completar la navegación contextual en las páginas de revisión e historial, y mejorar el breadcrumb de OposicionPage para alinear la jerarquía de navegación del producto.

1. Añadir links oposición/tema en la tabla del historial.
2. Añadir links contextuales (tema/oposición) en la página de revisión de test.
3. Mejorar el breadcrumb de OposicionPage siguiendo el patrón de TemaPage.

## Base documental (fuente)
- `docs/05-diseno-ux-plataforma.md` → navegación fluida entre secciones.
- `docs/44-ux-maximizar-uso.md` → continuidad y orientación del usuario.

## Alcance comprometido

### PR #105 — Links oposición/tema en tabla HistorialPage [P0]
- Columna Oposición de la tabla → link a `/oposicion/:oposicionId` si existe el ID.
- Columna Materia/Tema → nombre del tema convertido en link a `/tema/:temaId` si existe el ID.

### PR #106 — Links contextuales en ReviewPage + patch backend [P0]
- Backend: query `getTestReview` ampliada con `LEFT JOIN oposiciones` para devolver `oposicionId` y `oposicionNombre`.
- Frontend: `temaNombre` en info card se convierte en link clickable si hay `temaId`.
- Botones "Ver tema" y "Ver oposición" añadidos al bloque de acciones (visibles solo si existen los IDs).

### PR #107 — Breadcrumb en OposicionPage [P1]
- Reemplaza `← Inicio` por breadcrumb `<nav>` coherente con TemaPage: **`Inicio › Mis oposiciones`**.

## Implementación realizada

### PR #105 — Links oposición/tema en HistorialPage ✅
- Archivo modificado: `frontend/src/pages/HistorialPage.jsx`
- `Link` ya estaba importado — no fue necesario modificar imports.
- Columna Oposición: `{t.oposicionId ? <Link to={/oposicion/${t.oposicionId}}>...</Link> : '—'}`.
- Columna Materia/Tema: parte del tema convertida en `<Link to={/tema/${t.temaId}}>` si existe `temaId`.

### PR #106 — Patch getTestReview + links en ReviewPage ✅
- Archivos modificados:
  - `backend/src/repositories/test.repository.js`
  - `frontend/src/pages/ReviewPage.jsx`
- Backend: query de `getTestReview` añade `t.oposicion_id` y `LEFT JOIN oposiciones op ON op.id = t.oposicion_id`. El objeto devuelto incluye `oposicionId` y `oposicionNombre`.
- Frontend: `Link` añadido al import de react-router-dom. `temaNombre` en la info card se envuelve en `<Link to={/tema/${testInfo.temaId}}>` si hay `temaId`. Botones "Ver tema" y "Ver oposición" añadidos en el bloque de acciones.

### PR #107 — Breadcrumb OposicionPage ✅
- Archivo modificado: `frontend/src/pages/OposicionPage.jsx`
- Sustituye `<Link to="/">← Inicio</Link>` por `<nav>` con: `Inicio › Mis oposiciones`.
- Mismo patrón de estilos que TemaPage (`fontSize 13`, `color #64748b`, `display flex`, `gap 6`).

## Validación
- `npm test` backend: sin regresiones ✅
- `npm run build` frontend: sin errores ✅

## Estado actual
- Sprint 27 completado. Mergeado a main local (`da352f2`).
- Ramas pusheadas a GitHub: `sprint-27/pr-105-historial-links`, `sprint-27/pr-106-review-links`, `sprint-27/pr-107-oposicion-breadcrumb`.
- PRs pendientes de crear y mergear en GitHub (requieren squash/rebase merge por política del repo).
