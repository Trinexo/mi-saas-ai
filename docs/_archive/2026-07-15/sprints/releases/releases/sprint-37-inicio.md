# Sprint 37 — Descomposición ProgressPage en secciones reutilizables

**Rama:** `sprint-37/pr-133-progress-sections`  
**PR:** #133 (mergeado en main — commit `b4d3706`)  
**Fecha:** 2025

---

## Objetivo

`ProgressPage.jsx` had grown to **613 líneas** con 14 `useState`, 4 `useEffect` y 6 secciones de UI completamente mezcladas. El objetivo del sprint fue descomponer la página en componentes autocontenidos, siguiendo el mismo patrón aplicado en Sprint 36 con `HomePage.jsx`.

---

## Cambios realizados

### Componentes creados (`frontend/src/components/progress/`)

| Componente | Líneas | Descripción |
|---|---|---|
| `ResumenGlobalSection.jsx` | ~77 | Estadísticas globales (tests, aciertos, errores, blancos, nota media, tiempo). CardGrid + barra de acierto. Llama a `testApi.userStats()`. |
| `RachaObjetivoSection.jsx` | ~78 | Racha de estudio + objetivo diario, layout side-by-side. Llama a `getRacha` + `getObjetivoDiario` en paralelo. Retorna `null` si ambos son null. |
| `EvolucionSection.jsx` | ~55 | Tabla de evolución de los últimos 30 tests. Llama a `evolucionStats(token, 30)`. Retorna `null` si < 2 entradas. |
| `EstadisticasPorTemaSection.jsx` | ~230 | Componente complejo: selector cascading oposición → materia → tema, stats del tema seleccionado, botón "Practicar repaso" y tabla de simulacros. Combina dos secciones visuales porque comparten el estado `selOposicion`. |
| `ProgresoTemasSection.jsx` | ~85 | Tabla de progreso por tema con filtro por oposición y mini barra de progreso por fila. Llama a `testApi.getProgresoTemas()`. |
| `RachaTemasSection.jsx` | ~65 | Tabla de racha por tema (top 15) con color-coding por nivel de racha. Llama a `testApi.getRachaTemas()`. |

### `ProgressPage.jsx` refactorizada

- **613 → 25 líneas**
- Solo contiene: nav breadcrumb + 6 imports + composición JSX
- Sin `useState`, sin `useEffect`, sin lógica de negocio

### Docs

- `docs/sprint-36-inicio.md` movido a `docs/releases/sprint-36-inicio.md` (incluido en este PR)

---

## Arquitectura de los componentes de sección

**Principio:** cada sección es completamente autocontenida.

```
SectionComponent
├── useAuth() → token
├── useState (datos, loading)
├── useEffect (fetch al montar, cleanup con cancelled flag)
└── return <section>...</section>
```

No reciben props. No comparten estado con `ProgressPage`. Esto permite:
- Moverlos a otra página sin cambios
- Testearlos de forma aislada
- Reutilizarlos en dashboards futuros

**Excepción:** `EstadisticasPorTemaSection` agrupa dos bloques visuales porque ambos dependen del mismo `selOposicion`. Separar el estado requeriría prop-drilling o context extra — no justificado para MVP.

---

## Métricas

| Métrica | Antes | Después |
|---|---|---|
| `ProgressPage.jsx` líneas | 613 | 25 |
| `useState` en la página | 14 | 0 |
| `useEffect` en la página | 4 | 0 |
| Componentes de sección nuevos | 0 | 6 |
| Build errors | 0 | 0 |

---

## Siguientes pasos sugeridos

- Sprint 38: Descomponer `HistorialPage.jsx` (278 líneas) o `ReviewPage.jsx` (260 líneas)
- Añadir tests unitarios a los nuevos componentes de sección
- Considerar una función `formatTime` compartida en `src/utils/` si más componentes la necesitan
