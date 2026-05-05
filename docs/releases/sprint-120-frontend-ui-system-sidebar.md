# Sprint 120 — Rediseño UI: sistema de estilos y sidebar principal

**Fecha:** 2026-05-04  
**Tipo:** Frontend — rediseño visual  
**Rama:** feature/sprint-120-ui-system-sidebar

---

## Objetivo

Establecer el nuevo sistema de diseño corporativo (naranja `#ea580c` + negro `#111827`, light mode) y rediseñar el layout principal con sidebar fijo, reemplazando la estética oscura del MVP por una interfaz SaaS profesional.

---

## Archivos afectados

| Archivo | Tipo | Cambio |
|---|---|---|
| `frontend/src/styles.css` | modificado | Variables CSS light mode, `--sidebar-width: 240px`, clases `.sidebar` y `.app-shell-content` |
| `frontend/src/components/MainLayout.jsx` | modificado | Sidebar 240px fijo, paleta naranja, active states naranja, bottom nav mobile, iconos SVG inline |

---

## Sistema de diseño establecido

### Paleta de colores (usada en toda la serie de rediseño)

| Token | Valor | Uso |
|---|---|---|
| `O` | `#ea580c` | Primary — botones, activos, acentos |
| `OBG` | `#fff7ed` | Fondo suave naranja |
| `BD` | `#e5e7eb` | Bordes y divisores |
| `DK` | `#111827` | Texto principal |
| `G` | `#374151` | Texto secundario |
| `GL` | `#9ca3af` | Texto terciario / labels |

### Constante CARD (base de todas las tarjetas)

```js
{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }
```

### Sidebar — navegación final

```
Inicio · Practicar · Historial · Simulacros · Ranking · Favoritas · Mi progreso · Catálogo · Planes
```

Iconos SVG añadidos al mapa `ICON_SVG`: `simulacros`, `trophy`.

### Mobile

Sidebar oculto → barra inferior fija con los 5 destinos principales.

---

## Verificación

- Build Vite: 0 errores
- Layout funcional desktop y mobile

---

## Serie rediseño frontend (sprints 120–125)

| Sprint | Área | Estado |
|---|---|---|
| **120** | **Sistema CSS + Sidebar** | **✅** |
| 121 | HomePage dashboard | ✅ |
| 122 | TestPage split layout | ✅ |
| 123 | SimulacrosPage + RankingPage | ✅ |
| 124 | ProgressPage + Recharts | ✅ |
| 125 | ConfigurarTestPage + formularios | ✅ |
