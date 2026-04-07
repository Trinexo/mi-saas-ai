# Sprint 70 — progressTemario.repository.js split

## Resumen

División de `progressTemario.repository.js` (306 líneas, 7 métodos) en dos archivos especializados con barrel de compatibilidad.

## Archivos modificados

### Nuevos

- **`progressTemarioResumen.repository.js`** — Estadísticas rápidas y resúmenes:
  - `getTemaStats` — estadísticas básicas de un tema para el usuario
  - `getRepasoStats` — número de preguntas pendientes de repaso espaciado
  - `getResumenOposicion` — resumen agregado por oposición (temas, tests, nota media)

- **`progressTemarioDetalle.repository.js`** — Vistas detalladas de progreso:
  - `getProgresoTemas` — listado de temas con progreso (filtrable por oposición)
  - `getProgresoMaterias` — progreso desglosado por materia
  - `getProgresoTemasByMateria` — temas de una materia con detalle completo
  - `getDetalleTema` — ficha completa de un tema con historial de tests

### Convertidos a barrel

- **`progressTemario.repository.js`** — Barrel de compatibilidad. Re-exporta `progressTemarioRepository` como unión de ambos sub-repositorios. Sin cambios en el importador (`progressStats.repository.js`).

## Verificación

- Build frontend: **327.31 kB** ✅
- CI: 4/4 checks pasados ✅
- PR código: #197 mergeado (`2026-04-07T09:46:20Z`)
