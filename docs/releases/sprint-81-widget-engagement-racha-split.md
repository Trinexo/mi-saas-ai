# Sprint 81 — Split widgetEngagementRacha.repository

**Fecha:** 2026-04-07  
**Tipo:** Refactor — división de repositorio  
**PR:** #219 (mergeado en main)

---

## Objetivo

Dividir `widgetEngagementRacha.repository.js` (187 líneas, 3 métodos + helpers compartidos) en dos sub-repositorios especializados por dominio funcional.

---

## Archivos afectados

| Archivo | Tipo | Contenido |
|---|---|---|
| `widgetEngagementRachaGamificacion.repository.js` | nuevo | `getGamificacion` |
| `widgetEngagementRachaStreaks.repository.js` | nuevo | `getRacha` + `getRachaTemas` + helpers (`toDayIndex`, `calcBestStreak`, `calcCurrentStreak`) |
| `widgetEngagementRacha.repository.js` | barrel de compatibilidad | re-exporta todo |

---

## Criterio de división

- **Gamificacion** (`widgetEngagementRachaGamificacion`): cálculo de XP, nivel y progreso de nivel basado en tests y aciertos acumulados.
- **Streaks** (`widgetEngagementRachaStreaks`): lógica de rachas de estudio — racha actual, mejor racha, actividad 7 días, y rachas por tema. Incluye los helpers de cálculo temporal (`toDayIndex`, `calcBestStreak`, `calcCurrentStreak`).

---

## Compatibilidad

- `widgetEngagement.repository.js` (barrel padre) **no requiere cambios**: sigue importando `widgetEngagementRachaRepository` desde el barrel de compatibilidad.
- El objeto exportado `widgetEngagementRachaRepository` mantiene los 3 métodos originales mediante spread.

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
| **81** | **`widgetEngagementRacha.repository.js`** | **`widgetEngagementRachaGamificacion`** | **`widgetEngagementRachaStreaks`** |
