# Sprint 5 — Inicio

Fecha: 13 de marzo de 2026
Estado: cerrado

## Objetivo del sprint
Implementar el motor de generación adaptativo: priorizar preguntas falladas por el usuario, añadir distribución configurable de dificultad y mejorar la pantalla de progreso con visibilidad real sobre el rendimiento por tema.

## Base técnica disponible
- `respuestas_usuario.correcta` — historial de aciertos/errores por pregunta y usuario (Sprint 3)
- `preguntas.nivel_dificultad` — SMALLINT (1=fácil, 2=media, 3=difícil) sin usar aún en selección
- `pickFreshQuestions` — ya excluye las últimas 200 preguntas vistas aleatoriamente (Sprint 4 PR 01)
- `progreso_usuario` — acumulado de aciertos/errores por usuario y tema (Sprint 3)
- `validate` middleware con source configurable + schemas Zod por módulo (Sprint 4 PR 03–PR 10)

## Alcance comprometido

### P0 — Motor adaptativo en backend (PR 01 + PR 02)
- Índices DB para consultas de scoring adaptativo.
- Nuevo `pickAdaptiveQuestions` con scoring SQL basado en historial de respuestas:
  - `CASE: pregunta nunca vista → score 0 | último fallo → score +3 | último acierto → score -1`
  - Penalización si la pregunta fue respondida en los últimos 7 días: `score -2`
- `generateTestSchema` acepta campo opcional `modo: 'normal' | 'adaptativo'` (default `'adaptativo'`).
- `testService.generate` enruta entre `pickAdaptiveQuestions` y `pickFreshQuestions` según `modo`.

### P1 — Generación con distribución de dificultad (PR 03)
- `generateTestSchema` acepta campo opcional `dificultad: 'facil' | 'media' | 'dificil' | 'mixto'` (default `'mixto'`).
- Distribución mixta: 40 % dificultad media, 30 % fácil, 30 % difícil (ajustada si no hay suficientes de algún nivel).
- Funciona tanto en modo normal como adaptativo.

### P1 — Frontend: selector modo y dificultad (PR 04)
- `HomePage.jsx`: selector de modo (Normal / Adaptativo) y selector de dificultad (Mixta / Fácil / Media / Difícil).
- `testApi.js`: `generate` pasa `modo` y `dificultad` al backend.
- `ResultPage.jsx` o badge en `TestPage.jsx`: indicador del modo con el que se generó el test.

## Fuera de alcance en este sprint
- Spaced repetition con intervalos de días (SM-2 o similar) — se plantea en Sprint 6.
- Perfil de usuario con nivel global y temas fuertes/débiles calculados automáticamente.
- Dashboard de analítica avanzada.
- Tests simulacro multi-tema con distribución por oposición.

## Criterios de Done
- El modo adaptativo prioriza preguntas falladas: si el usuario ha fallado preguntas del tema, aparecen antes que las nuevas.
- El modo normal sigue el comportamiento actual (aleatorio con exclusión de recientes).
- La distribución de dificultad funciona en ambos modos.
- CI en verde: `test-backend` y `build-frontend`.
- Tests unitarios para: schema `generateTestSchema` (modo + dificultad) y lógica de scoring.

## Riesgos
- Riesgo: el scoring SQL por historial puede ser lento si `respuestas_usuario` crece mucho.
  - Mitigación: índice `idx_respuestas_usuario_scoring` + LATERAL join limitado.
- Riesgo: banco de preguntas pequeño hace que la distribución mixta no pueda cumplirse estrictamente.
  - Mitigación: lógica de fallback graceful — si no hay suficientes de un nivel, completar con otros.
- Riesgo: cambio de contrato en `generate` (nuevos campos) puede romper clientes sin actualizar.
  - Mitigación: todos los campos nuevos son `optional().default(...)` — compatibilidad hacia atrás garantizada.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | DB + Backend | Índices adaptativos + `pickAdaptiveQuestions` con scoring SQL |
| 02 | Backend | Schema `generateTestSchema` con `modo` + service con routing |
| 03 | Backend | Distribución de dificultad en generación (`dificultad: mixto/facil/media/dificil`) |
| 04 | Frontend | Selector modo/dificultad en `HomePage` + indicador en `ResultPage` |

## Trazabilidad de PR ejecutados (Sprint 5)

| PR | Sprint | Objetivo principal | Estado |
|---|---|---|---|
| 01 | Sprint 5 | Índices adaptativos en DB + `pickAdaptiveQuestions` con scoring SQL por historial de respuestas | Completado |
| 02 | Sprint 5 | Campo `modo` en `generateTestSchema` + routing adaptativo/normal en `testService.generate` | Completado |
| 03 | Sprint 5 | Campo `dificultad` + distribución 40/30/30 (mixto) + índice `idx_preguntas_tema_dificultad` | Completado |
| 04 | Sprint 5 | Selectores `modo`/`dificultad` en `HomePage.jsx` + badge en `ResultPage.jsx` | Completado |

Referencias:
- `docs/releases/sprint-5-pr-01-body.md`
- `docs/releases/sprint-5-pr-02-body.md`
- `docs/releases/sprint-5-pr-03-body.md`
- `docs/releases/sprint-5-pr-04-body.md`
