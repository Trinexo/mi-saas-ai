# Sprint 35 — Limpieza de styles.css

**Rama base:** `main` @ `5fa129b`  
**Main tras sprint:** `c06fcd3`  
**PRs:** #129  
**Fecha:** 2026-03-26

---

## Objetivo del sprint

Eliminar de `styles.css` todas las clases CSS que habían quedado sin uso tras la migración completa a estilos inline (Sprints 31-34). Conservar únicamente los selectores de elemento globales necesarios para el reset y la tipografía base.

---

## PR #129 — Limpieza styles.css

**Rama:** `sprint-35/pr-129-css-cleanup`  
**Commit squash:** `c06fcd3`  
**Archivo:** `frontend/src/styles.css`

### Clases eliminadas (12)

| Clase eliminada | Motivo |
|---|---|
| `.app-shell` | Migrada a inline en `MainLayout.jsx` (Sprint 34) |
| `.topbar` | Migrada a inline en `MainLayout.jsx` (Sprint 34) |
| `.topbar nav` | Migrada a inline en `MainLayout.jsx` (Sprint 34) |
| `.card, .center-card` | Migradas a inline en todos los JSX (Sprints 31-34) |
| `.center-card` (específico) | Ídem |
| `.form-grid` | Migrada a inline (Sprints 32-34) |
| `button.selected` | Migrada a inline en `TestPage.jsx` (Sprint 32) |
| `.options` | Migrada a inline en `TestPage.jsx` (Sprint 32) |
| `.actions` | Migrada a inline en `TestPage.jsx` (Sprint 32) |
| `.error` | Migrada a inline en múltiples páginas (Sprints 32-34) |
| `.table-wrap` | Migrada a inline (Sprints 32-34) |
| `.row` | Migrada a inline (Sprints 32-34) |

### Selectores conservados

```css
/* Reset y tipografía global */
* { box-sizing: border-box; font-family: Arial, sans-serif; }
body { margin: 0; background: #f5f7fb; color: #1f2937; }

/* Elementos de formulario: layout base */
form { display: grid; gap: 10px; }
input, select, button { padding: 10px; border-radius: 8px; border: 1px solid #d1d5db; }
button { cursor: pointer; background: #111827; color: white; border: none; }

/* Tabla: normalización */
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #e5e7eb; text-align: left; padding: 8px; }
```

### Impacto en bundle

| Métrica | Antes | Después |
|---|---|---|
| CSS bundle (raw) | 0.98 kB | 0.38 kB |
| CSS bundle (gzip) | 0.49 kB | 0.26 kB |
| Reducción | — | **−61%** |

---

## Estado tras Sprint 35

- `styles.css` queda con **37 líneas** (antes 126) — solo estilos base globales
- 0 clases CSS referenciadas en JSX — todo el diseño es inline
- La arquitectura de estilos del proyecto está completamente limpia y preparada para adoptar un sistema de diseño propio o una librería de componentes en el futuro
