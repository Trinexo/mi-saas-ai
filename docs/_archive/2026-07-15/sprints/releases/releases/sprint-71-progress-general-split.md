# Sprint 71 — progressGeneral.repository.js split

## Resumen

División de `progressGeneral.repository.js` (177 líneas, 5 métodos) en dos archivos especializados con barrel de compatibilidad.

## Archivos modificados

### Nuevos

- **`progressGeneralStats.repository.js`** — Estadísticas y métricas globales:
  - `getUserStats` — totales de tests, aciertos, errores, nota media y tiempo medio
  - `getDashboard` — resumen agregado para el panel principal del usuario
  - `getSimulacrosStats` — historial de simulacros por oposición

- **`progressGeneralEvolucion.repository.js`** — Evolución y oposiciones del usuario:
  - `getEvolucion` — serie temporal de notas para gráfico de evolución
  - `getMisOposiciones` — listado de oposiciones practicadas con progreso y maestría

### Convertidos a barrel

- **`progressGeneral.repository.js`** — Barrel de compatibilidad. Re-exporta `progressGeneralRepository` como unión de ambos sub-repositorios. Sin cambios en el importador (`progressStats.repository.js`).

## Verificación

- Build frontend: **327.31 kB** ✅
- CI: 4/4 checks pasados ✅
- PR código: #199 mergeado (`2026-04-07T11:06:17Z`)
