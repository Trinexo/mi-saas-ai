# Sprint 44 — Descomposición MarcadasPage en 4 componentes presentacionales

## Resumen

Se descompuso `MarcadasPage.jsx` (127 líneas) en 4 componentes presentacionales en `frontend/src/components/marcadas/`. La página quedó reducida a **66 líneas** (−48%).

## Motivación

`MarcadasPage` mezclaba la lógica de filtrado, los estados de UI y el renderizado de cada tarjeta de pregunta en un único bloque `return`. Al extraer secciones, el código de la página queda centrado en estado y handlers, mientras los componentes gestionan únicamente presentación.

## Componentes creados

### `MarcadasHeader.jsx`
- **Ubicación**: `frontend/src/components/marcadas/MarcadasHeader.jsx`
- **Props**: `preguntas`, `preguntasFiltradas`, `filtroTema`, `onPracticar`, `isLoading`
- **Responsabilidad**: Breadcrumb nav, título "Preguntas marcadas ★", contador con texto condicional (filtro activo), botón "▶ Practicar" (disabled + tooltip dinámico) y enlace "Ver progreso →".

### `MarcadasFiltro.jsx`
- **Ubicación**: `frontend/src/components/marcadas/MarcadasFiltro.jsx`
- **Props**: `preguntas`, `filtroTema`, `onFiltroChange`
- **Responsabilidad**: Input de búsqueda por tema. Retorna `null` si `preguntas.length === 0`.

### `MarcadasPreguntaCard.jsx`
- **Ubicación**: `frontend/src/components/marcadas/MarcadasPreguntaCard.jsx`
- **Props**: `pregunta`, `onDesmarcar`
- **Responsabilidad**: Tarjeta de pregunta con enunciado, metadata (tema/oposición/dificultad con links), botón "☆ Quitar" y bloque de explicación opcional en azul.
- **Nota**: Contiene `DIFICULTAD_LABEL` (movido desde `MarcadasPage`).

### `MarcadasLista.jsx`
- **Ubicación**: `frontend/src/components/marcadas/MarcadasLista.jsx`
- **Props**: `preguntas`, `preguntasFiltradas`, `filtroTema`, `onDesmarcar`
- **Responsabilidad**: Gestiona tres estados: sin preguntas marcadas, filtro sin resultados, y lista de tarjetas. Importa `MarcadasPreguntaCard` internamente.

## Cambios en `MarcadasPage.jsx`

| Métrica | Antes | Después |
|---|---|---|
| Líneas | 127 | 66 |
| Reducción | — | −61 líneas (−48%) |
| `DIFICULTAD_LABEL` | Definido en página | Movido a `MarcadasPreguntaCard` |
| Import `Link` | En página | Movido a `MarcadasHeader` y `MarcadasPreguntaCard` |

## Patrón aplicado

Presentacional con props. Los callbacks `onDesmarcar` y `onPracticar` permanecen en la página porque contienen llamadas a API y gestión de estado. `MarcadasLista` anida `MarcadasPreguntaCard` — mismo patrón que `OposicionMateriasTable`.

## Verificación

- Build: **121 módulos transformados, 0 errores, 2.21s**
- CI: 4/4 checks exitosos antes del merge

## PRs relacionados

- `#147` — Código (rama `sprint-44/pr-147-marcadas-sections`)
- `#149` — Este documento (rama `sprint-44-45/pr-149-docs`)
