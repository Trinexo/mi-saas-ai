# Sprint 34 — Migración inline styles en layouts y panel de administración

**Rama base:** `main` @ `b69aed2`  
**Main tras sprint:** `25669ec`  
**PRs:** #127  
**Fecha:** 2026-03-26

---

## Objetivo del sprint

Eliminar los 37 `className` restantes en los archivos de layout general y panel de administración. Junto con los Sprints 32 y 33, este sprint cierra definitivamente la migración completa a estilos inline en todo el frontend.

---

## PR #127 — Inline styles completo en layouts y panel admin

**Rama:** `sprint-34/pr-127-admin-inline`  
**Commit squash:** `25669ec`  
**Archivos:** `MainLayout.jsx` · `AdminLayout.jsx` · `AdminDashboardPage.jsx` · `AdminRevisionPage.jsx` · `AdminUsersPage.jsx` · `AdminCatalogPage.jsx` · `AdminQuestionsPage.jsx`

### Volumen de cambios por archivo

| Archivo | `className` eliminados |
|---|---|
| `MainLayout.jsx` | 2 (`app-shell`, `topbar`) |
| `AdminLayout.jsx` | 8 (`admin-layout`, `admin-sidebar`, 5× NavLink activo, `admin-content`) |
| `AdminDashboardPage.jsx` | 1 (`card`) |
| `AdminRevisionPage.jsx` | 1 (`card`) |
| `AdminUsersPage.jsx` | 3 (`card`, `table-wrap`, `row`) |
| `AdminCatalogPage.jsx` | 4 (`btn-secondary`, 3× `card`) |
| `AdminQuestionsPage.jsx` | 18 (detalle abajo) |
| **Total** | **37** |

### Detalle AdminQuestionsPage (18 className)

| Clase | Contexto | Sustitución |
|---|---|---|
| `card` (section) | Contenedor principal | `background: white, borderRadius: 10, padding: 16, boxShadow` |
| `form-grid` (filtros) | Grid de selects filtro | `display: grid, gap: 10, marginBottom: 12` |
| `table-wrap` (preguntas) | Tabla principal | `overflow: auto, marginBottom: 16` |
| `row` (td acciones) | Celda Editar/Eliminar | `display: flex, alignItems: center, gap` |
| `btn-danger` | Botón Eliminar | `style={{ background: '#dc2626' }}` |
| `row` (paginación preguntas) | Paginador | `display: flex, alignItems: center` |
| `form-grid` (nueva pregunta) | Formulario crear/editar | `display: grid, gap: 10, marginBottom: 12` |
| `row` (opciones) ×4 | Fila opción + radio | `display: flex, alignItems: center, gap` |
| `row` (botones form) | Submit / Cancelar | `display: flex, alignItems: center, gap` |
| `form-grid` (CSV) | Formulario importador | `display: grid, gap: 10, marginBottom: 12` |
| `table-wrap` (CSV preview) | Previsualización CSV | `overflow: auto, marginBottom: 16` |
| `row` (filtro reportes) | Select estado reporte | `display: flex, alignItems: center, gap` |
| `table-wrap` (reportes) | Tabla moderación | `overflow: auto, marginBottom: 16` |
| `row` (filtros auditoría) | Inputs auditoría | `display: flex, alignItems: center, flexWrap: wrap` |
| `table-wrap` (auditoría) | Tabla auditoría | `overflow: auto, marginBottom: 16` |
| `row` (paginación auditoría) | Paginador auditoría | `display: flex, alignItems: center` |
| `success` | Mensaje éxito | `style={{ color: 'green' }}` |
| `error` | Mensaje error | `style={{ color: '#dc2626' }}` |

### Cambios destacados en AdminLayout

Los `NavLink` ya no usan `className` con clase `active`. Se migran a la prop `style` con función:

```jsx
// Antes
className={({ isActive }) => (isActive ? 'active' : undefined)}

// Después
style={({ isActive }) => isActive ? { fontWeight: 700, color: '#60a5fa' } : { color: '#d1d5db' }}
```

El sidebar admin pasa de clase CSS `.admin-sidebar` a inline: `width: 220, background: '#1f2937', color: '#f9fafb', padding: '24px 16px'`.

### Cambios en MainLayout

| Clase | Sustitución |
|---|---|
| `app-shell` | `maxWidth: 1100, margin: '0 auto', padding: 16` |
| `topbar` | `display: flex, alignItems: center, justifyContent: space-between, gap: 12, marginBottom: 20` |

---

## Validación

```
Build Vite: ✓ 66 modules transformed — 0 errores
className restantes en frontend/src: 0 (confirmado con Select-String)
CI: test-backend ✓ · build-frontend ✓
```

---

## Estado tras Sprint 34

- **0 `className`** en absolutamente todos los archivos JSX del proyecto
- La migración completa desde clases CSS globales a estilos inline abarca los Sprints 31 → 34 (PRs #119 → #127)
- `styles.css` con sus definiciones de clase queda como deuda técnica a limpiar en un sprint futuro

### Historial de la migración inline styles

| Sprint | PRs | Archivo(s) |
|---|---|---|
| 31 | #119 #120 #121 | ProgressPage · HistorialPage · ReviewPage |
| 32 | #123 #124 #125 | TestPage · ProgressPage · 6 páginas residuales |
| 33 | #126 | HomePage (49 className) |
| 34 | #127 | MainLayout · AdminLayout · 5 páginas admin |
