# Sprint 83 — Split widgetEngagementFoco.repository

**Fecha:** 2026-04-07  
**Tipo:** Refactor — división de repositorio  
**PR:** #223 (mergeado en main)

---

## Objetivo

Dividir `widgetEngagementFoco.repository.js` (126 líneas, 3 métodos) en dos sub-repositorios especializados por dominio funcional.

---

## Archivos afectados

| Archivo | Tipo | Métodos |
|---|---|---|
| `widgetEngagementFocoTemas.repository.js` | nuevo | `getTemasDebiles` |
| `widgetEngagementFocoSesion.repository.js` | nuevo | `getFocoHoy`, `getObjetivoDiario` |
| `widgetEngagementFoco.repository.js` | barrel de compatibilidad | re-exporta todo |

---

## Criterio de división

- **Temas** (`widgetEngagementFocoTemas`): análisis de los temas con menor porcentaje de acierto acumulado — base para priorizar el estudio.
- **Sesion** (`widgetEngagementFocoSesion`): lógica de sesión de estudio activa — qué estudiar hoy (repaso, refuerzo o adaptativo) y seguimiento del objetivo diario de preguntas.

---

## Compatibilidad

- `widgetEngagement.repository.js` (barrel padre) **no requiere cambios**: sigue importando `widgetEngagementFocoRepository` desde el barrel de compatibilidad.
- El objeto exportado `widgetEngagementFocoRepository` mantiene los 3 métodos originales mediante spread.

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
| 82 | `widgetRendimientoActividad.repository.js` | `widgetRendimientoActividadConsistencia` | `widgetRendimientoActividadSemanal` |
| **83** | **`widgetEngagementFoco.repository.js`** | **`widgetEngagementFocoTemas`** | **`widgetEngagementFocoSesion`** |
