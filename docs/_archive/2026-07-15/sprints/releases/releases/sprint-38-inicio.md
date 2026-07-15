# Sprint 38 — Descomposición HistorialPage en componentes presentacionales

**Rama:** `sprint-38/pr-135-historial-sections`  
**PR:** #135 (mergeado en main — commit `edae225`)  
**Fecha:** 2025

---

## Objetivo

`HistorialPage.jsx` tenía **295 líneas** mezclando 12 estados de filtro, lógica de filtrado/ordenación, cálculos de estadísticas, una tabla compleja y paginación.

---

## Diferencia de patrón respecto a Sprint 37

En Sprint 37 (`ProgressPage`) cada sección tenía estado completamente independiente, por lo que los componentes podían ser **autocontenidos** (sin props, llamando cada uno a su propia API).

En Sprint 38 (`HistorialPage`) el patrón es distinto: los 12 filtros son estado **compartido** entre el panel de filtros, la tabla y el contador de resultados. Separar ese estado requeriría prop-drilling o context innecesario para MVP.

**Solución aplicada:** componentes **presentacionales** que reciben props desde `HistorialPage`.

---

## Componentes creados (`frontend/src/components/historial/`)

| Componente | Líneas | Props recibidas |
|---|---|---|
| `HistorialFiltros.jsx` | ~100 | 12 filtros + setters + oposiciones + counts + onResetPage |
| `HistorialStats.jsx` | ~25 | testsLast7Days, bestNoteLast30Days, mejorTestSemana, onReintentar |
| `HistorialTabla.jsx` | ~45 | itemsOrdenados, onReintentar |
| `HistorialPaginacion.jsx` | ~12 | page, total, pageSize, onPrev, onNext — retorna `null` si no hay páginas |

### `HistorialPage.jsx` refactorizada

- **295 → 191 líneas**
- Mantiene: 12 useState de filtros, 2 useEffect, lógica de filtrado/ordenación derivada, `handleReintentar`
- Delega: toda la UI a los 4 componentes anteriores

---

## Métricas

| Métrica | Antes | Después |
|---|---|---|
| `HistorialPage.jsx` líneas | 295 | 191 |
| Componentes presentacionales nuevos | 0 | 4 |
| Build errors | 0 | 0 |
| Módulos compilados | 92 | 96 |

---

## Decisiones de diseño

- **`HistorialFiltros` recibe `onResetPage`** en lugar de `setPage` directamente — los filtros de oposición y periodo necesitan reiniciar la paginación a 1, y esto los desacopla del tipo concreto del setter.
- **`HistorialPaginacion` retorna `null`** cuando no hay suficientes resultados para paginar, eliminando la condición `{total > PAGE_SIZE && ...}` del componente padre.
- **`MODO_LABEL` movido a `HistorialTabla`** — es el único lugar donde se usa.

---

## Siguientes pasos sugeridos

- Sprint 39: Descomponer `ReviewPage.jsx` (285 líneas) — candidato más grande restante
- Sprint 40: Descomponer `TestPage.jsx` (187 líneas)
