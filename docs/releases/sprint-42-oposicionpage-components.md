# Sprint 42 — Descomposición OposicionPage en componentes presentacionales

## Objetivo

Reducir `OposicionPage.jsx` de 160 a 57 líneas extrayendo sus 4 secciones visuales como componentes presentacionales que reciben props.

## Componentes creados

| Archivo | Líneas | Props | Responsabilidad |
|---|---|---|---|
| `components/oposicion/OposicionMaestriaBar.jsx` | 18 | `resumen` | Barra de maestría global con porcentaje y color condicional |
| `components/oposicion/OposicionStatsGrid.jsx` | 21 | `resumen` | Grid de 6 tarjetas de estadísticas |
| `components/oposicion/OposicionAcciones.jsx` | 23 | `id`, `onTestCompleta` | Botones de acciones rápidas |
| `components/oposicion/OposicionMateriasTable.jsx` | 58 | `materias`, `oposicionId`, `onPracticar` | Tabla de progreso por materia con mini-barras |

## Decisiones de diseño

### Callbacks como props para la navegación
`onTestCompleta` y `onPracticar` se definen en OposicionPage y se pasan como props. Esto mantiene la lógica de navegación (`useNavigate`) en la página y los componentes quedan sin dependencias de routing.

### `maestriaColor` calculado en cada componente
Tanto `OposicionMaestriaBar` como `OposicionMateriasTable` calculan el color internamente (lógica 2 líneas) en lugar de recibirlo como prop, evitando proliferación de props derivadas.

### `materias.length === 0` gestionado en el componente
`OposicionMateriasTable` retorna `null` si no hay materias. La página no necesita condicionarlo.

## Métricas

| Fichero | Antes | Después | Reducción |
|---|---|---|---|
| `OposicionPage.jsx` | 160 líneas | 57 líneas | -103 líneas (-64%) |

## Verificación

- Build Vite: 113 módulos, 0 errores, 1.93s
- PR #143 mergeado en main (`f567793`)

## Serie de descomposición de páginas

| Sprint | Página | Antes | Después | Patrón | Componentes |
|---|---|---|---|---|---|
| 37 | ProgressPage | 613 | 25 | Self-contained | 9 |
| 38 | HistorialPage | 295 | 191 | Presentacional | 3 |
| 39 | ReviewPage | 285 | 137 | Presentacional | 7 |
| 40 | TestPage | 187 | 111 | Presentacional | 4 |
| 41 | ProfilePage | 167 | 18 | Self-contained | 2 |
| **42** | **OposicionPage** | **160** | **57** | **Presentacional** | **4** |

## Próxima candidata

| Página | Líneas |
|---|---|
| `TemaPage.jsx` | ~155 |
