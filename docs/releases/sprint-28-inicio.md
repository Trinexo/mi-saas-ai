# Sprint 28 — Inicio

Fecha: 25 de marzo de 2026
Estado: completado

## Objetivo del sprint
Completar la cadena de navegación contextual para MateriaPage y la tabla de progreso por temas:

1. Enriquecer el endpoint de progreso por materia con datos de oposición.
2. Añadir breadcrumb completo `Inicio › Mis oposiciones › Oposición` en MateriaPage.
3. Hacer clickable la columna "Materia" en la tabla "Progreso por tema" de ProgressPage.

## Base documental (fuente)
- `docs/05-diseno-ux-plataforma.md` → navegación fluida y orientación jerárquica.
- `docs/44-ux-maximizar-uso.md` → continuidad entre secciones del producto.

## Alcance comprometido

### PR #108 — Backend: getProgresoTemasByMateria añade oposicionId [P0]
- `getProgresoTemasByMateria` en `stats.repository.js` amplía la query con `JOIN oposiciones` para devolver `oposicionId` y `oposicionNombre` por cada tema.

### PR #109 — Frontend: Breadcrumb en MateriaPage [P0]
- Reemplaza `← Inicio` por `<nav>` consistente con TemaPage y OposicionPage:
  **`Inicio › Mis oposiciones › {oposicionNombre}`**
- El link a la oposición es dinámico (usa `oposicionId` del primer tema cargado).

### PR #110 — Frontend: Link /materia/:id en ProgressPage [P1]
- Columna "Materia" en tabla "Progreso por tema" de ProgressPage pasa de texto plano a `<Link to="/materia/:materiaId">`.
- `materiaId` ya estaba disponible en los datos de `getProgresoTemas`.

## Implementación realizada

### PR #108 ✅
- Archivo modificado: `backend/src/repositories/stats.repository.js`
- Query ampliada: `JOIN oposiciones o ON o.id = m.oposicion_id`, añadidos `o.id AS oposicion_id` y `o.nombre AS oposicion_nombre`.
- `GROUP BY` actualizado para incluir `m.id`, `o.id`, `o.nombre`.
- Objeto retornado añade `materiaId`, `oposicionId` y `oposicionNombre`.
- Test validado: `node --test tests/services/stats-progreso-temas-materia.test.js` → 5/5 ✅

### PR #109 ✅
- Archivo modificado: `frontend/src/pages/MateriaPage.jsx`
- Se extraen `oposicionId` y `oposicionNombre` de `temas[0]`.
- Breadcrumb `<nav>` con `Inicio → Mis oposiciones → {oposicionNombre}` (link dinámico si existe `oposicionId`).

### PR #110 ✅
- Archivo modificado: `frontend/src/pages/ProgressPage.jsx`
- Columna Materia: `{t.materiaNombre}` → `<Link to={/materia/${t.materiaId}}>` si existe `t.materiaId`.

## Validación
- Backend (targeted): `node --test tests/services/stats-progreso-temas-materia.test.js` ✅ (5/5)
- Frontend: `npm run build` ✅

## Estado actual
- Sprint 28 completado y mergeado en GitHub (`#108`, `#109`, `#110`).
