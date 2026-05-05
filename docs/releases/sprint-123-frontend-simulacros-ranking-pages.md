# Sprint 123 — Rediseño UI: nuevas páginas SimulacrosPage y RankingPage

**Fecha:** 2026-05-04  
**Tipo:** Frontend — nuevas páginas + rutas + sidebar  
**Rama:** feature/sprint-123-simulacros-ranking-pages

---

## Objetivo

Crear dos nuevas páginas (`SimulacrosPage` y `RankingPage`) con el sistema de diseño del Sprint 120, registrar sus rutas en `App.jsx` y añadir sus entradas al sidebar de `MainLayout`.

---

## Archivos afectados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/pages/SimulacrosPage.jsx` | nuevo | Página de simulacros |
| `frontend/src/pages/RankingPage.jsx` | nuevo | Página de ranking |
| `frontend/src/App.jsx` | modificado | Rutas `/simulacros` y `/ranking` |
| `frontend/src/components/MainLayout.jsx` | modificado | Entradas Simulacros y Ranking en `NAV_LINKS` |

---

## SimulacrosPage

- Grid de oposiciones vía `catalogApi.getOposiciones()`
- Badge activo / sin acceso por oposición
- Acción "Iniciar simulacro" → `testApi.generate({ modo:'simulacro', oposicionId, duracionSegundos })`
- Historial de simulacros realizados
- CTA a `/planes` para usuarios sin plan Pro

## RankingPage

- Gauge semicircular SVG para percentil del usuario
- 4 KPI cards (posición, mejores racha, nota media, tests)
- Tabla top-10 con fila del usuario resaltada en naranja
- Nota disclaimer de privacidad

---

## Rutas registradas en App.jsx

```jsx
<Route path="/simulacros" element={<SimulacrosPage />} />
<Route path="/ranking"    element={<RankingPage />} />
```

---

## Sidebar actualizado

Iconos SVG añadidos: `simulacros` (documento con reloj), `trophy` (trofeo).

Orden final del sidebar:
```
Inicio · Practicar · Historial · Simulacros · Ranking · Favoritas · Mi progreso · Catálogo · Planes
```

---

## Verificación

- Build Vite: 0 errores
- Rutas accesibles y navegación desde sidebar funcional

---

## Serie rediseño frontend (sprints 120–125)

| Sprint | Área | Estado |
|---|---|---|
| 120 | Sistema CSS + Sidebar | ✅ |
| 121 | HomePage dashboard | ✅ |
| 122 | TestPage split layout | ✅ |
| **123** | **SimulacrosPage + RankingPage** | **✅** |
| 124 | ProgressPage + Recharts | ✅ |
| 125 | ConfigurarTestPage + formularios | ✅ |
