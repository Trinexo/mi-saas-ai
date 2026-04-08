# Sprint 94 – Refactor testSubmit.service

## Fecha
2026-04-08

## Objetivo
Reducir complejidad de `testSubmit.service.js` separando validación y scoring en sub-servicios, manteniendo la API pública `submit` y el flujo transaccional actual.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testSubmitValidation.service.js` | Nuevo | Validaciones de envío y consistencia de respuestas |
| `testSubmitScoring.service.js` | Nuevo | Evaluación de respuestas y cálculo de métricas |
| `testSubmit.service.js` | Refactor | Orquestador transaccional de persistencia |

## Cambios clave
- Se extraen validaciones de:
  - ownership/existencia de test
  - estado finalizado
  - preguntas duplicadas
  - pertenencia de preguntas al test
- Se extrae evaluación de respuestas para calcular:
  - `aciertos`
  - `errores`
  - `blancos`
  - `nota`
  - `respuestasEvaluadas`
- `testSubmit.service.js` mantiene:
  - transacción (`BEGIN/COMMIT/ROLLBACK`)
  - persistencia en repositorio
  - actualización de progreso
  - fire-and-forget de repetición espaciada

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #244 mergeado
