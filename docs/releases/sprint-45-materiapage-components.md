# Sprint 45 — Descomposición MateriaPage en 2 componentes presentacionales

## Resumen

Se descompuso `MateriaPage.jsx` (117 líneas) en 2 componentes presentacionales en `frontend/src/components/materia/`. La página quedó reducida a **59 líneas** (−50%).

## Motivación

`MateriaPage` tenía el bloque de la barra de maestría y la tabla de temas completamente inline, sumando ~80 líneas solo en el `return`. Al tener únicamente 2 secciones de peso, se crean 2 componentes enfocados en lugar de forzar 4.

## Componentes creados

### `MateriaMaestriaBar.jsx`
- **Ubicación**: `frontend/src/components/materia/MateriaMaestriaBar.jsx`
- **Props**: `maestriaGlobal`, `colorGlobal`
- **Responsabilidad**: Tarjeta con título "Maestría global", porcentaje coloreado y barra de progreso animada.
- **Nota**: `colorGlobal` se calcula en `MateriaPage` y se pasa como prop (ya disponible para el subtítulo de la página).

### `MateriaTemasTable.jsx`
- **Ubicación**: `frontend/src/components/materia/MateriaTemasTable.jsx`
- **Props**: `temas`, `onPracticar`
- **Responsabilidad**: Tabla de temas con columnas nombre (link a `/tema/:id`), preguntas respondidas/total, barra mini de maestría con color condicional por fila, porcentaje de acierto y botón "Practicar". Retorna `<p>` de estado vacío si `temas.length === 0`.

## Cambios en `MateriaPage.jsx`

| Métrica | Antes | Después |
|---|---|---|
| Líneas | 117 | 59 |
| Reducción | — | −58 líneas (−50%) |
| `color` inline de maestría por fila | En página (dentro del `.map`) | Movido a `MateriaTemasTable` |
| `navigate` en cada fila | En página | Encapsulado en callback `onPracticar(temaId)` |

## Patrón aplicado

Presentacional con props. `colorGlobal` derivado en la página (se reutiliza en título y en `MateriaMaestriaBar`). Callback `onPracticar(temaId)` en la página encapsula la navegación con `{ temaId, materiaId }`.

## Verificación

- Build: **119 módulos transformados, 0 errores, 1.95s**
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
| 44 | MarcadasPage | 127 | 66 | −48% | Presentacional | 4 |
| 45 | MateriaPage | 117 | 59 | −50% | Presentacional | 2 |

## PRs relacionados

- `#148` — Código (rama `sprint-45/pr-148-materia-sections`)
- `#149` — Este documento junto con Sprint 44 (rama `sprint-44-45/pr-149-docs`)
