# Sprint 90 – Split statsRendimientoResumen.controller

## Fecha
2026-04-07

## Objetivo
Dividir `statsRendimientoResumen.controller.js` (83 líneas, 9 handlers) en dos sub-controladores por responsabilidad, manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `statsRendimientoResumenOverview.controller.js` | Nuevo | Handlers de resumen y dashboard |
| `statsRendimientoResumenEvolucion.controller.js` | Nuevo | Handlers de evolución y rachas |
| `statsRendimientoResumen.controller.js` | Barrel | Compatibilidad — re-exporta ambos sub-controladores |

## División de responsabilidades

### `statsRendimientoResumenOverview.controller.js`
- `getResumenSemana`
- `getFocoHoy`
- `getGamificacion`
- `getObjetivoDiario`
- `getDashboard`

### `statsRendimientoResumenEvolucion.controller.js`
- `getUserStats`
- `getEvolucion`
- `getRacha`
- `getRachaTemas`

## Barrel de compatibilidad

```js
export * from './statsRendimientoResumenOverview.controller.js';
export * from './statsRendimientoResumenEvolucion.controller.js';
```

No se requieren cambios en `statsRendimiento.controller.js`, `stats.controller.js` ni en rutas existentes.

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #236 mergeado
