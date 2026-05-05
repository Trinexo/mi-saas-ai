# Sprint 122 — Rediseño UI: TestPage split layout

**Fecha:** 2026-05-04  
**Tipo:** Frontend — rediseño visual  
**Rama:** feature/sprint-122-testpage-redesign

---

## Objetivo

Rediseñar `TestPage.jsx` con layout de dos columnas en desktop (panel lateral fijo + área de pregunta) que maximiza el uso de pantalla y mejora la UX durante la resolución del test.

---

## Archivos afectados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/pages/TestPage.jsx` | modificado | Split layout + componentes inline |

---

## Layout implementado

### Desktop (≥768px)

```
┌──────────────────┬─────────────────────────────┐
│  LeftPanel 260px │  Área pregunta (flex-1)     │
│  sticky          │  Enunciado + opciones        │
│  NavGrid 4×n     │  Controles                   │
│  Leyenda estados │                              │
└──────────────────┴─────────────────────────────┘
```

### Mobile

Panel izquierdo oculto. Padding inferior 96px para no solapar con bottom nav.

---

## Componentes inline creados

| Componente | Responsabilidad |
|---|---|
| `TestHeader` | Sticky. Badge modo + barra de progreso naranja + cronómetro |
| `LeftPanel` | Grid navegación 4 col + leyenda visual de estados de respuesta |
| `Controls` | Botón submit naranja, prev/next, diálogo de confirmación |

---

## Eliminaciones

| Import eliminado | Razón |
|---|---|
| `TestControles` | Reemplazado por `Controls` inline |
| `TestTimer` | Integrado en `TestHeader` |

Mantenidos: `TestNavGrid`, `TestPregunta`, `ReviewReportDialog`.

---

## Cambios visuales clave

- Header pegajoso con barra de progreso doble (respondidas + correctas en modo feedback inmediato)
- Panel lateral fondo `#f9fafb`, `borderRadius 16`, borde gris
- Pregunta activa en nav grid: borde naranja + fondo `#fff7ed`
- Botón submit: naranja `#ea580c`

---

## Verificación

- Build Vite: 0 errores

---

## Serie rediseño frontend (sprints 120–125)

| Sprint | Área | Estado |
|---|---|---|
| 120 | Sistema CSS + Sidebar | ✅ |
| 121 | HomePage dashboard | ✅ |
| **122** | **TestPage split layout** | **✅** |
| 123 | SimulacrosPage + RankingPage | ✅ |
| 124 | ProgressPage + Recharts | ✅ |
| 125 | ConfigurarTestPage + formularios | ✅ |
