# Sprint 82 — Split widgetRendimientoActividad.repository

**Fecha:** 2026-04-07  
**Tipo:** Refactor — división de repositorio  
**PR:** #221 (mergeado en main)

---

## Objetivo

Dividir `widgetRendimientoActividad.repository.js` (165 líneas, 4 métodos) en dos sub-repositorios especializados por dominio funcional.

---

## Archivos afectados

| Archivo | Tipo | Métodos |
|---|---|---|
| `widgetRendimientoActividadConsistencia.repository.js` | nuevo | `getConsistenciaDiaria`, `getActividad14Dias` |
| `widgetRendimientoActividadSemanal.repository.js` | nuevo | `getProgresoSemanal`, `getResumenSemana` |
| `widgetRendimientoActividad.repository.js` | barrel de compatibilidad | re-exporta todo |

---

## Criterio de división

- **Consistencia** (`widgetRendimientoActividadConsistencia`): métricas de regularidad a largo plazo — constancia en los últimos 30 días y mapa de actividad de los últimos 14 días.
- **Semanal** (`widgetRendimientoActividadSemanal`): métricas de rendimiento semanal — progreso día a día de la última semana y resumen agregado de los últimos 7 días.

---

## Compatibilidad

- `widgetRendimiento.repository.js` (barrel padre) **no requiere cambios**: sigue importando `widgetRendimientoActividadRepository` desde el barrel de compatibilidad.
- El objeto exportado `widgetRendimientoActividadRepository` mantiene los 4 métodos originales mediante spread.

---

## Build

```
327.31 kB — sin variación
```

---

## Estado del refactoring acumulado

| Sprint | Barrel | Sub-archivo A | Sub-archivo B |
|---|---|---|---|
| 72 | `adminReportes.repository.js` | `adminReportesPreguntas` | `adminReportesAuditoria` |
| 73 | `adminPreguntasListado.repository.js` | `adminPreguntasListadoBrowse` | `adminPreguntasListadoRevision` |
| 74 | `testEvaluation.service.js` | `testSubmit` | `testQuery` |
| 75 | `adminDashboard.repository.js` | `adminDashboardStats` | `adminDashboardUsers` |
| 76 | `adminPreguntasEntity.repository.js` | `adminPreguntasEntityWrite` | `adminPreguntasEntityRead` |
| 77 | `adminPanel.service.js` | `adminPanelReportes` | `adminPanelUsers` |
| 78 | `statsProgreso.controller.js` | `statsProgresoTema` | `statsProgresoOposicion` |
| 79 | `widgetRendimientoMetricas.repository.js` | `widgetRendimientoMetricasTiempo` | `widgetRendimientoMetricasPrecision` |
| 80 | `progressTemarioDetalle.repository.js` | `progressTemarioDetalleBrowse` | `progressTemarioDetalleDetail` |
| 81 | `widgetEngagementRacha.repository.js` | `widgetEngagementRachaGamificacion` | `widgetEngagementRachaStreaks` |
| **82** | **`widgetRendimientoActividad.repository.js`** | **`widgetRendimientoActividadConsistencia`** | **`widgetRendimientoActividadSemanal`** |
