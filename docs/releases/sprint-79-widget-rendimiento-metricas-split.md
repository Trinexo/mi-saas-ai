# Sprint 79 — Split widgetRendimientoMetricas.repository

**Fecha:** 2026-04-07  
**Tipo:** Refactor — division de repositorio  
**PR:** #215 (mergeado en main)

---

## Objetivo

Dividir `widgetRendimientoMetricas.repository.js` (241 líneas, 5 métodos) en dos sub-repositorios especializados por dominio funcional.

---

## Archivos afectados

| Archivo | Tipo | Métodos |
|---|---|---|
| `widgetRendimientoMetricasTiempo.repository.js` | nuevo | `getRitmoPregunta`, `getEficienciaTiempo` |
| `widgetRendimientoMetricasPrecision.repository.js` | nuevo | `getBalancePrecision`, `getRendimientoModos`, `getInsightMensual` |
| `widgetRendimientoMetricas.repository.js` | barrel de compatibilidad | re-exporta todo |

---

## Criterio de división

- **Tiempo** (`widgetRendimientoMetricasTiempo`): métodos que miden velocidad y eficiencia temporal del usuario —segundos por pregunta, tiempo medio por test, aciertos por minuto.
- **Precisión** (`widgetRendimientoMetricasPrecision`): métodos que miden calidad de respuesta —balance aciertos/errores/blancos, rendimiento por modo de test, insight mensual de nota.

---

## Compatibilidad

- `widgetRendimiento.repository.js` (barrel padre) **no requiere cambios**: sigue importando `widgetRendimientoMetricasRepository` desde el barrel de compatibilidad.
- El objeto exportado `widgetRendimientoMetricasRepository` mantiene los 5 métodos originales mediante spread.

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
| **79** | **`widgetRendimientoMetricas.repository.js`** | **`widgetRendimientoMetricasTiempo`** | **`widgetRendimientoMetricasPrecision`** |
