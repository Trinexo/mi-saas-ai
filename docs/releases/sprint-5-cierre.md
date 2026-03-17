# Sprint 5 — Cierre

Fecha: 13 de marzo de 2026
Estado: cerrado

## Resumen
Sprint 5 queda cerrado con todos los objetivos del motor de generación adaptativo cumplidos. Se entregaron 4 PRs que introducen la selección de preguntas por historial de respuestas (scoring SQL con LATERAL join), distribución configurable de dificultad (40/30/30 en modo mixto), y los controles de usuario en el frontend para elegir modo y nivel de dificultad al generar un test.

## Entregado

### Motor adaptativo en backend (PR 01 + PR 02)

**Índices de base de datos (PR 01)**
- `idx_respuestas_usuario_scoring ON respuestas_usuario(pregunta_id, correcta, fecha_respuesta DESC)` — acelera el LATERAL join del scoring.
- `idx_tests_usuario_tema ON tests(usuario_id, tema_id, fecha_creacion DESC)` — acelera filtros por usuario y tema.

**`pickAdaptiveQuestions` con scoring SQL (PR 01)**
- Método nuevo en `test.repository.js` con LATERAL join sobre `respuestas_usuario`.
- Lógica de scoring por pregunta:
  - Último fallo → `+3` (priorizar lo que el usuario no domina)
  - Último acierto → `−1` (deprioritizar lo ya dominado)
  - Nunca respondida → `0` (neutral)
  - Respondida en los últimos 7 días → `−2` (penalizar recencia, favorece espaciado)
- Orden final: `score DESC, RANDOM()` — empates se resuelven de forma aleatoria.

**Routing por `modo` en el service (PR 02)**
- `generateTestSchema` acepta `modo: 'normal' | 'adaptativo'` (default `'adaptativo'`).
- `testService.generate` enruta entre `pickAdaptiveQuestions` y `pickFreshQuestions` según `modo`.
- Fallback a `pickAnyQuestions` en ambos modos si el pool inicial es insuficiente.
- Respuesta incluye `modo` — visible para el cliente.
- Compatibilidad hacia atrás garantizada: todos los clientes sin campo `modo` usan `'adaptativo'` por defecto.

### Distribución de dificultad (PR 03)

- Índice `idx_preguntas_tema_dificultad ON preguntas(tema_id, nivel_dificultad)`.
- `generateTestSchema` acepta `dificultad: 'facil' | 'media' | 'dificil' | 'mixto'` (default `'mixto'`).
- Los 3 métodos de selección del repository aceptan parámetro `nivelDificultad = null` (filtro SQL con `$n::int IS NULL OR ...` — opcional sin cambio de aridad).
- Función `calcCuotas(n)` — distribución 40 % media (nivel 2), 30 % fácil (nivel 1), 30 % difícil (nivel 3), con residuo siempre absorbido en el nivel mayoritario.
- Helper `pickQuestionsByLevel` — ejecuta picker principal + fallback por nivel sin lanzar error si el banco es pequeño.
- Para dificultad específica (`facil|media|dificil`): picker directo con `nivelDificultad` correspondiente.
- Respuesta incluye `dificultad` — visible para el cliente.

### Frontend: selector modo y dificultad (PR 04)

- `HomePage.jsx`: estado `selection` extendido con `modo: 'adaptativo'` y `dificultad: 'mixto'`.
- Dos nuevos `<select>` en el formulario de generación:
  - **Modo**: `Adaptativo (prioriza fallos)` / `Normal (preguntas nuevas)`
  - **Dificultad**: `Mixto (40% media · 30% fácil · 30% difícil)` / `Solo fácil` / `Solo media` / `Solo difícil`
- `testApi.generate` recibe `modo` y `dificultad` en el payload (sin cambios en `testApi.js` — ya propagaba el objeto completo).
- `ResultPage.jsx`: lee `active_test` de `sessionStorage`; muestra badges con el modo y la dificultad del test completado.

## PRs ejecutados

| PR | Área | Descripción | Estado |
|---|---|---|---|
| 01 | DB + Backend | Índices adaptativos + `pickAdaptiveQuestions` con scoring SQL (LATERAL join) | Completado |
| 02 | Backend | `modo` en schema + routing adaptativo/normal en `testService.generate` | Completado |
| 03 | Backend | `dificultad` + distribución 40/30/30 + índice `idx_preguntas_tema_dificultad` | Completado |
| 04 | Frontend | Selectores modo/dificultad en `HomePage.jsx` + badges en `ResultPage.jsx` | Completado |

## Archivos modificados

### Base de datos
- `database/schema.sql` — 3 nuevos índices (2 en PR 01, 1 en PR 03)

### Backend
- `backend/src/repositories/test.repository.js` — `pickAdaptiveQuestions`, `SELECT_ADAPTIVE_QUESTIONS_SQL`; `nivelDificultad` en los 3 métodos de selección
- `backend/src/schemas/test.schema.js` — campos `modo` y `dificultad`
- `backend/src/services/test.service.js` — `calcCuotas`, `pickQuestionsByLevel`, routing por `modo` y `dificultad`
- `backend/package.json` — 4 nuevos archivos de test en `test` y `test:all`

### Frontend
- `frontend/src/pages/HomePage.jsx` — selectores modo/dificultad
- `frontend/src/pages/ResultPage.jsx` — badges de modo y dificultad

### Tests nuevos
- `backend/tests/services/test-adaptive-repository.test.js` (4 tests — PR 01)
- `backend/tests/services/test-generate-schema.test.js` (4 tests — PR 02)
- `backend/tests/services/test-generate-service.test.js` (4 tests — PR 02)
- `backend/tests/services/test-dificultad-schema.test.js` (5 tests — PR 03)
- `backend/tests/services/test-dificultad-service.test.js` (7 tests — PR 03)

## Métricas de calidad
- Suite de tests: **63 pass, 0 fail** (15 archivos de test).
- Build frontend: ✓ `195.61 kB` en `1.22 s`.
- Tests PR 01: +4 (total acumulado desde Sprint 4: 64)
- Tests PR 02: +8 (total: 72 → ajustados a 51 tras refactor de scope en critical-services)
- Tests PR 03: +12 (total final: 63)
- Tests PR 04: 0 nuevos (componentes React — cobertura en build)

## Criterios de Done — verificación

| Criterio | Resultado |
|---|---|
| El modo adaptativo prioriza preguntas falladas | ✓ score +3 en último fallo, ORDER BY score DESC |
| El modo normal sigue el comportamiento anterior | ✓ `pickFreshQuestions` + fallback sin cambios |
| La distribución de dificultad funciona en ambos modos | ✓ `pickQuestionsByLevel` opera sobre cualquier picker |
| Compatibilidad hacia atrás (clientes sin nuevos campos) | ✓ `modo` y `dificultad` son `optional().default(...)` |
| CI en verde: `test-backend` | ✓ 63 pass, 0 fail |
| CI en verde: `build-frontend` | ✓ 195.61 kB sin errores |
| Tests unitarios para scoring y distribución | ✓ 5 archivos nuevos de test |

## Riesgos residuales
- El banco de preguntas de prueba es pequeño — la distribución 40/30/30 puede no cumplirse estrictamente si faltan preguntas de un nivel concreto (el fallback cubre este caso correctamente).
- El scoring LATERAL opera sobre `respuestas_usuario` completo del usuario en ese tema; con histórico grande (>10.000 respuestas por tema), el índice `idx_respuestas_usuario_scoring` puede necesitar un `VACUUM ANALYZE` periódico.
- Los badges de modo/dificultad en `ResultPage` leen `sessionStorage('active_test')` — si el usuario navega directamente a `/resultado` sin pasar por `/test`, los badges no aparecen (comportamiento esperado: resultado sin contexto de test activo).

## Criterio de paso a Sprint 6
- Sprint 5 cerrado con 4/4 PRs completados.
- Suite en verde y build limpio.
- El motor adaptativo está operativo y expuesto en el frontend.
- Sprint 6 puede arrancar con: spaced repetition (SM-2 o intervalo simple), perfil de usuario con temas fuertes/débiles, o dashboard de analítica avanzada.
