# Kickoff — Inicio Sprint 4

Fecha: 12 de marzo de 2026
Estado: en curso

## Objetivo del sprint
Consolidar la base entregada en Sprint 3 con foco en robustez operativa, analítica incremental y rendimiento del flujo principal.

## Alcance recomendado (MVP)
- Robustez:
  - validaciones de regresión en flujos críticos
  - endurecimiento de errores y respuestas consistentes
  - revisión de casos edge en generación, submit y estadísticas
- Analítica incremental:
  - consolidar métricas útiles para usuario
  - ampliar trazabilidad de progreso sin sobrecargar el MVP
- Rendimiento:
  - revisar consultas críticas de generación y estadísticas
  - validar índices existentes y añadir solo los necesarios

## Prioridades
- P0:
  - estabilizar generación y corrección de test
  - reforzar estadísticas básicas por usuario y tema
  - cubrir regresiones críticas en CI
- P1:
  - mejorar UX de resultados y progreso
  - optimizar consultas con más impacto
- P2:
  - preparar terreno para analítica más rica o spaced repetition futura

## Criterios de Done
- No hay regresiones en `generate`, `submit`, `stats/user` y `stats/tema`.
- CI mantiene en verde `test-backend` y `build-frontend`.
- Cada mejora de rendimiento queda justificada con consulta/índice concreto.
- El sprint deja backlog claro para evolución de analítica o aprendizaje adaptativo.

## Riesgos iniciales
- Riesgo de añadir complejidad analítica sin valor inmediato.
- Riesgo de optimizar consultas sin medir el cuello real.
- Riesgo de regresión funcional al endurecer validaciones.

## Mitigación
- Mantener enfoque MVP: priorizar valor directo para el opositor.
- Cambios pequeños y medibles por PR.
- Validar comportamiento antes de optimizar implementación.

## Primeros PR sugeridos
- PR 01: endurecimiento de validaciones y regresión crítica.
- PR 02: refuerzo de estadísticas básicas y consistencia de respuestas.
- PR 03: optimización de consultas/índices con evidencia.
