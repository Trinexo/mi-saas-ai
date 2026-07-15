# Sprint 43 — Descomposición TemaPage en 4 componentes presentacionales

## Resumen

Se descompuso `TemaPage.jsx` (155 líneas) en 4 componentes presentacionales reutilizables ubicados en `frontend/src/components/tema/`. La página quedó reducida a **44 líneas** (−72%).

## Motivación

`TemaPage` mezclaba lógica de UI (formateo de tiempo, cálculo de color de maestría) con la estructura de la pantalla. Siguiendo el patrón establecido en Sprints 37–42, se extrae cada sección a su propio componente para mejorar mantenibilidad y reutilización.

## Componentes creados

### `TemaStatsGrid.jsx`
- **Ubicación**: `frontend/src/components/tema/TemaStatsGrid.jsx`
- **Props**: `tema`
- **Responsabilidad**: Rejilla de 5 tarjetas de estadísticas (total preguntas, respondidas, aciertos en verde, errores en rojo, porcentaje de acierto).
- **Layout**: `repeat(auto-fill, minmax(160px,1fr))`

### `TemaMaestriaBar.jsx`
- **Ubicación**: `frontend/src/components/tema/TemaMaestriaBar.jsx`
- **Props**: `tema`
- **Responsabilidad**: Barra de progreso de maestría con porcentaje y color condicional (`#22c55e` ≥70 %, `#f59e0b` ≥40 %, `#ef4444` resto). Muestra la fecha de última práctica si está disponible.
- **Nota**: `maestriaColor` calculado internamente; no se pasa como prop.

### `TemaTestsTable.jsx`
- **Ubicación**: `frontend/src/components/tema/TemaTestsTable.jsx`
- **Props**: `tests` (array `tema.ultimosTests`)
- **Responsabilidad**: Tabla de últimos tests con columnas fecha, nota (coloreada ≥5 verde/rojo), aciertos, errores, tiempo y enlace "Revisar" a `/revision/:testId`.
- **Notas**:
  - Retorna `null` si el array está vacío (no renderiza sección).
  - Contiene el helper `formatTime` (movido desde `TemaPage`).

### `TemaAcciones.jsx`
- **Ubicación**: `frontend/src/components/tema/TemaAcciones.jsx`
- **Props**: `onPracticar`, `materiaId`
- **Responsabilidad**: Botón "Practicar este tema" (llama al callback del padre) y enlace "← Ver materia" a `/materia/:materiaId`.

## Cambios en `TemaPage.jsx`

| Métrica | Antes | Después |
|---|---|---|
| Líneas | 155 | 44 |
| Reducción | — | −111 líneas (−72%) |
| Helpers inline | `formatTime` | Movido a `TemaTestsTable` |
| Cálculos inline | `maestriaColor` | Movido a `TemaMaestriaBar` |

El estado (`tema`, `loading`, `error`) y la lógica de carga (`testApi.getDetalleTema`) permanecen en la página. El callback `onPracticar` encapsula la navegación con `{ temaId, materiaId, oposicionId }`.

## Patrón aplicado

Presentacional con props: la página gestiona estado y efectos; los componentes solo renderizan datos. El mismo patrón de Sprints 38–43.

## Verificación

- Build: **117 módulos transformados, 0 errores, 2.02s**
- CI: 4/4 checks exitosos antes del merge

## Serie de descomposiciones acumulada

| Sprint | Página | Antes | Después | Reducción | Patrón | Componentes |
|---|---|---|---|---|---|---|
| 37 | ProgressPage | 613 | 25 | −96% | Self-contained | 9 |
| 38 | HistorialPage | 295 | 191 | −35% | Presentacional | 3 |
| 39 | ReviewPage | 285 | 137 | −52% | Presentacional | 7 |
| 40 | TestPage | 187 | 111 | −41% | Presentacional | 4 |
| 41 | ProfilePage | 167 | 18 | −89% | Self-contained | 2 |
| 42 | OposicionPage | 160 | 57 | −64% | Presentacional | 4 |
| 43 | TemaPage | 155 | 44 | −72% | Presentacional | 4 |

## PRs relacionados

- `#145` — Código: descomposición TemaPage (rama `sprint-43/pr-145-tema-sections`)
- `#146` — Este documento (rama `sprint-43/pr-146-docs`)
