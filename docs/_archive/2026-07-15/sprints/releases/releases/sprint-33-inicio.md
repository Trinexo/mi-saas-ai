# Sprint 33 — Migración completa a inline styles en HomePage

**Rama base:** `main` @ `d617380`  
**Main tras sprint:** `b69aed2`  
**PRs:** #126  
**Fecha:** 2026-03-26

---

## Objetivo del sprint

Eliminar los 49 `className` restantes en `HomePage.jsx`, el único archivo del frontend que aún usaba clases CSS globales. Con este sprint el proyecto alcanza **0 `className` en todo el frontend**.

---

## PR #126 — Inline styles completo en HomePage

**Rama:** `sprint-33/pr-126-homepage-inline`  
**Commit squash:** `b69aed2`  
**Archivo:** `frontend/src/pages/HomePage.jsx`

### Volumen de cambios

| Tipo | Cantidad |
|---|---|
| `<section className="card">` eliminados | 18 |
| `<p className="hint">` eliminados | 22 |
| `<div className="form-grid">` eliminados | 2 |
| `<div className="table-wrap">` eliminados | 1 |
| `className="error"` eliminado | 1 |
| **Total `className` eliminados** | **49** |

### Clases → estilos inline aplicados

| Clase | Estilo inline equivalente |
|---|---|
| `card` | `{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16 }` |
| `hint` (base) | `{ fontSize: '0.875rem', color: '#6b7280' }` |
| `hint` + `marginTop: 0` | `{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }` |
| `hint` + `marginTop: '0.5rem'` | `{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }` |
| `hint` + `marginTop: '0.25rem'` | `{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }` |
| `form-grid` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', margin: '0.75rem 0' }` |
| `table-wrap` | `{ overflowX: 'auto', marginTop: '0.5rem' }` |
| `error` | `{ color: '#dc2626', padding: '1rem' }` |

### Secciones `card` migradas

Test recomendado · Foco de hoy · Resumen semanal · Continuidad 14 días · Tema a reforzar · Insight mensual · Rendimiento por modo · Progreso semanal · Eficiencia · Consistencia diaria · Ritmo de resolución · Balance de precisión · Tu nivel · Objetivo de hoy · Tu racha · Repaso pendiente hoy · Generar test · Simulacro de examen

### Nota de indentación

La sección **Generar test** usa 6 espacios de indentación (dentro de `<>` fragment), mientras que **Simulacro de examen** usa 4 espacios (nesting diferente). Ambas correctamente migradas.

---

## Estado tras Sprint 33

- **0 `className`** en todo el frontend (verificado con `Select-String -Pattern 'className'` → sin resultados)
- `styles.css` permanece pero sus clases quedan sin uso en JSX (candidato a limpieza futura)
