# Sprint 80 — Split progressTemarioDetalle.repository

**Fecha:** 2026-04-07  
**Tipo:** Refactor — división de repositorio  
**PR:** #217 (mergeado en main)

---

## Objetivo

Dividir `progressTemarioDetalle.repository.js` (209 líneas, 4 métodos) en dos sub-repositorios especializados por dominio funcional.

---

## Archivos afectados

| Archivo | Tipo | Métodos |
|---|---|---|
| `progressTemarioDetalleBrowse.repository.js` | nuevo | `getProgresoTemas`, `getProgresoMaterias` |
| `progressTemarioDetalleDetail.repository.js` | nuevo | `getProgresoTemasByMateria`, `getDetalleTema` |
| `progressTemarioDetalle.repository.js` | barrel de compatibilidad | re-exporta todo |

---

## Criterio de división

- **Browse** (`progressTemarioDetalleBrowse`): listados agregados de progreso — vista de todos los temas con aciertos y vista agrupada por materia.
- **Detail** (`progressTemarioDetalleDetail`): consultas de datos en profundidad — temas filtrados por una materia concreta y el detalle completo de un tema específico con historial de tests.

---

## Compatibilidad

- `progressTemario.repository.js` (barrel padre) **no requiere cambios**: sigue importando `progressTemarioDetalleRepository` desde el barrel de compatibilidad.
- El objeto exportado `progressTemarioDetalleRepository` mantiene los 4 métodos originales mediante spread.

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
| **80** | **`progressTemarioDetalle.repository.js`** | **`progressTemarioDetalleBrowse`** | **`progressTemarioDetalleDetail`** |
