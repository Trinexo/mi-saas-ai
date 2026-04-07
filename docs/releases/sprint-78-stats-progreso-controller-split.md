# Sprint 78 — Split statsProgreso.controller.js

## Objetivo

Dividir `statsProgreso.controller.js` (102 líneas, 9 handlers) en dos archivos de responsabilidad única, manteniendo compatibilidad total mediante barrel.

## Archivos afectados

### Nuevos

#### `backend/src/controllers/statsProgresoTema.controller.js`
Handlers relacionados con estadísticas de temas individuales y repaso.

| Handler | Descripción |
|---|---|
| `getTemasDebiles` | Temas con mayor tasa de error del usuario |
| `getProgresoTemas` | Progreso por temas (filtrable por oposición) |
| `getTemaStats` | Estadísticas de un tema concreto |
| `getRepasoStats` | Pendientes de repaso espaciado para un tema |
| `getDetalleTema` | Detalle completo de progreso en un tema por id |

#### `backend/src/controllers/statsProgresoOposicion.controller.js`
Handlers relacionados con estadísticas de oposición y materias.

| Handler | Descripción |
|---|---|
| `getSimulacrosStats` | Histórico de simulacros por oposición |
| `getResumenOposicion` | Resumen global de progreso en una oposición |
| `getProgresoMaterias` | Progreso desglosado por materias de una oposición |
| `getProgresoTemasByMateria` | Progreso de temas de una materia específica |
| `getMisOposiciones` | Listado de oposiciones con actividad del usuario |

### Modificados

#### `backend/src/controllers/statsProgreso.controller.js` — Barrel de compatibilidad
```js
// Barrel de compatibilidad - los handlers se han dividido en statsProgresoTema y statsProgresoOposicion.
export * from './statsProgresoTema.controller.js';
export * from './statsProgresoOposicion.controller.js';
```

## Importador único

`stats.controller.js` (barrel padre con `export * from './statsProgreso.controller.js'`) — sin cambios requeridos.

## Verificación

- Build frontend: `327.31 kB` ✅
- CI: 4/4 checks ✅
- PR código: #213 (merged `2026-04-07`)
