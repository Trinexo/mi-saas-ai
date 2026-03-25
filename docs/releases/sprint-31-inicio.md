# Sprint 31 — Breadcrumbs y estilos inline en páginas internas

**Rama base:** `main` @ `eb3a22b`  
**Main tras sprint:** `a74aa7d`  
**PRs:** #119 · #120 · #121  
**Fecha:** 2026-03-25

---

## Objetivo del sprint

Unificar la navegación de todas las páginas del usuario (ProgressPage, HistorialPage, ReviewPage) con el patrón breadcrumb `Inicio ›` introducido en Sprint 30 (MisOposicionesPage). Completar además la migración de clases CSS globales a estilos inline en ReviewPage, siguiendo el patrón ya aplicado en ResultPage.

---

## PR #119 — Breadcrumb en ProgressPage

**Rama:** `sprint-31/pr-119-progreso-breadcrumb`  
**Commit squash:** `4586c27`  
**Archivo:** `frontend/src/pages/ProgressPage.jsx`

### Cambio

Añade `<nav>` breadcrumb `Inicio › Mi progreso` antes del `<section>` principal:

```jsx
<nav style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 900, margin: '0 auto 16px', padding: '0 16px' }}>
  <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>Inicio</Link>
  <span>›</span>
  <span>Mi progreso</span>
</nav>
```

---

## PR #120 — Breadcrumb en HistorialPage

**Rama:** `sprint-31/pr-120-historial-breadcrumb`  
**Commit squash:** `98d6363`  
**Archivo:** `frontend/src/pages/HistorialPage.jsx`

### Cambio

Añade `<nav>` breadcrumb `Inicio › Historial` dentro del `<section>`, antes del `<h2>`:

```jsx
<nav style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
  <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>Inicio</Link>
  <span>›</span>
  <span>Historial</span>
</nav>
```

---

## PR #121 — Inline styles completo y breadcrumb en ReviewPage

**Rama:** `sprint-31/pr-121-review-inline-breadcrumb`  
**Commit squash:** `a74aa7d`  
**Archivo:** `frontend/src/pages/ReviewPage.jsx`

### Cambios

Migración completa de clases CSS a estilos inline. Clases eliminadas:

| Clase eliminada | Sustitución |
|---|---|
| `review-header` | `display: flex, justifyContent: space-between, alignItems: center` |
| `review-list` | `display: flex, flexDirection: column, gap: 16` |
| `review-question` | `background: #fff, borderRadius: 12, padding: 20px 24px, boxShadow` |
| `review-question-number` | `fontWeight: 500, fontSize: 14, color: #1e293b` |
| `review-options` | `listStyle: none, display: flex, flexDirection: column, gap: 6` |
| `review-option` | colores semánticos por resultado (verde/rojo/gris) |
| `review-explanation` | `background: #f0f9ff, borderRadius: 8, border: 1px solid #bae6fd` |
| `review-reference` | `fontSize: 12, color: #64748b` |
| `review-badge` / `badge` | `borderRadius: 999, fontSize: 12, fontWeight: 600` |
| `actions` | `display: flex, gap: 10, flexWrap: wrap, marginTop: 2rem` |
| `btn-secondary` | botón con `border: 1px solid #e2e8f0, background: #fff` |

Colores semánticos en opciones:
- **Correcta:** fondo `#f0fdf4`, borde `#bbf7d0`, texto `#166534`
- **Errónea elegida:** fondo `#fef2f2`, borde `#fecaca`, texto `#991b1b`
- **Resto:** fondo `#f8fafc`, borde `#e2e8f0`, texto `#334155`

Breadcrumb añadido:

```jsx
<nav style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
  <Link to="/" style={{ color: '#6366f1', textDecoration: 'none' }}>Inicio</Link>
  <span>›</span>
  <span>Revisión</span>
</nav>
```

---

## Estado del breadcrumb en la plataforma tras Sprint 31

| Página | Breadcrumb |
|---|---|
| `MisOposicionesPage` | `Inicio › Mis oposiciones` ✅ Sprint 30 |
| `ProgressPage` | `Inicio › Mi progreso` ✅ Sprint 31 |
| `HistorialPage` | `Inicio › Historial` ✅ Sprint 31 |
| `ReviewPage` | `Inicio › Revisión` ✅ Sprint 31 |
| `ResultPage` | pendiente |
| `TestPage` | no aplica (pantalla de examen) |

---

## Próximos pasos sugeridos (Sprint 32)

- Breadcrumb en `ResultPage` (`Inicio › Resultado`)
- Extraer componente `<Breadcrumb>` reutilizable para todas las páginas
- Revisar si quedan clases CSS globales en `TestPage` o `HomePage`
