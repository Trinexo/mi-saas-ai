# Sprint 121 — Rediseño UI: HomePage dashboard

**Fecha:** 2026-05-04  
**Tipo:** Frontend — rediseño visual  
**Rama:** feature/sprint-121-homepage-redesign

---

## Objetivo

Rediseñar `HomePage.jsx` con un dashboard SaaS moderno: barra KPI superior, card de continuación, plan semanal, recomendaciones y historial reciente, aplicando el sistema de diseño del Sprint 120.

---

## Archivos afectados

| Archivo | Tipo | Resultado |
|---|---|---|
| `frontend/src/pages/HomePage.jsx` | reescritura | ~373 líneas, 0 errores |

---

## Secciones implementadas

| Sección | Datos | Descripción |
|---|---|---|
| `KpiBar` | `testApi.userStats` | 4 métricas: racha 🔥, preguntas hoy, nota media, tests totales. Fondo OBG |
| `ContinuarCard` | `sessionStorage('active_test')` | CTA naranja si hay test en curso; CTA secundaria si no |
| `PlanSemanal` | `testApi.getRacha` | Grid 7 días, días activos en verde, hoy con borde naranja |
| Grid Recomendados | `testApi.userStats` | 3 cards: tema débil, modo recomendado, última materia |
| `HistorialReciente` | `testApi.userStats` | Tabla últimos 5 tests, nota con color condicional |

---

## Decisiones de diseño

- Componentes funcionales inline (sin archivos separados) — patrón coherente con el resto de páginas MVP.
- Estados de carga: spinner naranja. Estados vacíos: mensaje + CTA.
- Cabecera: `fontWeight 900`, `fontSize 1.5rem`, subtítulo en `#9ca3af`.

---

## Verificación

- Build Vite: 0 errores

---

## Serie rediseño frontend (sprints 120–125)

| Sprint | Área | Estado |
|---|---|---|
| 120 | Sistema CSS + Sidebar | ✅ |
| **121** | **HomePage dashboard** | **✅** |
| 122 | TestPage split layout | ✅ |
| 123 | SimulacrosPage + RankingPage | ✅ |
| 124 | ProgressPage + Recharts | ✅ |
| 125 | ConfigurarTestPage + formularios | ✅ |
