# Sprint 32 — Migración completa a inline styles (TestPage, ProgressPage, páginas residuales)

**Rama base:** `main` @ `a74aa7d`  
**Main tras sprint:** `d617380`  
**PRs:** #123 · #124 · #125  
**Fecha:** 2026-03-25

---

## Objetivo del sprint

Eliminar todas las clases CSS globales que quedaban en `TestPage.jsx`, `ProgressPage.jsx` y en las páginas residuales (MarcadasPage, HistorialPage, LoginPage, RegisterPage, ProfilePage, ReviewPage), migrando a estilos inline propios de cada componente. Objetivo final: 0 `className` en el frontend salvo `HomePage.jsx`.

---

## PR #123 — Inline styles en TestPage

**Rama:** `sprint-32/pr-123-testpage-inline`  
**Commit squash:** `e837154`  
**Archivo:** `frontend/src/pages/TestPage.jsx`

### Clases eliminadas

| Clase eliminada | Sustitución inline |
|---|---|
| `className="card"` | `style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}` |
| `className="options"` | `style={{ display: 'grid', gap: 8, marginBottom: 16 }}` |
| `className="selected"` | `style={{ background: '#2563eb' }}` (botón opción seleccionada) |
| `className="actions"` | `style={{ display: 'flex', gap: 8 }}` |
| `className="error"` | `style={{ color: '#dc2626' }}` |

---

## PR #124 — Inline styles completo en ProgressPage

**Rama:** `sprint-32/pr-124-progresspage-inline`  
**Commit squash:** `3224794`  
**Archivo:** `frontend/src/pages/ProgressPage.jsx`

### Clases eliminadas

| Clase eliminada | Sustitución inline |
|---|---|
| `className="card"` (múltiples) | `style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 }}` |
| `className="table-wrap"` | `style={{ overflowX: 'auto' }}` |
| `className="hint"` | `style={{ fontSize: '0.875rem', color: '#6b7280' }}` |
| `className="row"` | `style={{ display: 'flex', alignItems: 'center', gap: 8 }}` |

---

## PR #125 — Inline styles residuales (6 archivos)

**Rama:** `sprint-32/pr-125-residuales-inline`  
**Commit squash:** `d617380`  
**Archivos:** `MarcadasPage.jsx`, `HistorialPage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `ProfilePage.jsx`, `ReviewPage.jsx`

### Cambios por archivo

- **MarcadasPage:** eliminadas clases `card`, `hint`, `row`, `table-wrap`
- **HistorialPage:** eliminadas clases `card`, `table-wrap`, `hint`
- **LoginPage / RegisterPage:** eliminado `center-card` → `style={{ maxWidth: 420, margin: '40px auto', background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}`
- **ProfilePage:** eliminadas clases `card`, `row`, `hint`
- **ReviewPage:** revisión de clases residuales confirmadas en 0

### Estado tras PR #125

- 0 `className` en todos los archivos del frontend **salvo `HomePage.jsx`** (pendiente Sprint 33)

---

## Notas técnicas

- Patrón `card` unificado: `background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16`
- Patrón `hint`: `fontSize: '0.875rem', color: '#6b7280'`
- Patrón `table-wrap`: `overflowX: 'auto'`
- Las clases en `styles.css` quedan como definiciones no usadas (candidatas a eliminar en un sprint futuro de limpieza)
