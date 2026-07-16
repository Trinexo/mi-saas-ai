# Sprint 6 — Inicio

Fecha: 13 de marzo de 2026
Estado: en curso

## Objetivo del sprint
Implementar el sistema de repetición espaciada (Modo Repaso): registrar el estado de memoria de cada pregunta por usuario, calcular cuándo debe volver a ser revisada, y exponer un modo de generación de test que selecciona las preguntas con revisión pendiente.

## Base técnica disponible
- `respuestas_usuario.correcta` + `fecha_respuesta` — historial completo de respuestas (Sprints 3-4)
- `pickAdaptiveQuestions` — scoring SQL con LATERAL join (Sprint 5 PR 01)
- `modo: 'normal' | 'adaptativo'` en schema + service (Sprint 5 PR 02)
- `dificultad: 'facil' | 'media' | 'dificil' | 'mixto'` en schema + distribución (Sprint 5 PR 03)
- `progreso_usuario` — acumulado de aciertos/errores por usuario y tema (Sprint 3)
- `ProgressPage.jsx` con stats globales y por tema (Sprint 4)
- Pattern fire-and-forget establecido para operaciones post-commit (Sprint 4 PR 20 — auditoría)

## Alcance comprometido

### P0 — Tabla `repeticion_espaciada` en DB (PR 01)
- Nueva tabla que almacena el estado de memoria de cada (usuario, pregunta):
  - `nivel_memoria SMALLINT` (0–4): 0 = resetado/fallo, 4 = bien consolidado
  - `proxima_revision TIMESTAMP`: cuándo debe revisarse la pregunta
  - `ultima_revision TIMESTAMP`: cuándo fue la última respuesta registrada
  - `racha_aciertos SMALLINT`: aciertos consecutivos sin fallo
- Índices para las 2 consultas principales: búsqueda por `(usuario_id, proxima_revision)` y upsert por `(usuario_id, pregunta_id)`.

### P0 — Actualizar `repeticion_espaciada` al hacer submit (PR 02)
- Nuevo `spacedRepetitionRepository.js` con método `upsertRepaso({ userId, preguntaId, correcta })`.
- Lógica de intervalos (superposición con sistema tipo Anki simplificado):
  - Acierto → `nivel_memoria = LEAST(nivel + 1, 4)`, intervalo: nivel 0→1d, 1→3d, 2→7d, 3→14d, 4→30d
  - Fallo → `nivel_memoria = 0`, `proxima_revision = NOW() + 1 día`
  - UPSERT con `INSERT ... ON CONFLICT (usuario_id, pregunta_id) DO UPDATE`
- En `testService.submit`: fire-and-forget de `upsertRepaso` para cada respuesta después del COMMIT.

### P1 — `pickDueQuestions` + modo `'repaso'` (PR 03)
- Nuevo método `pickDueQuestions({ userId, temaId, numeroPreguntas })` en `test.repository.js`:
  - Selecciona preguntas donde `proxima_revision <= NOW()` para el usuario y tema.
  - Ordena por `proxima_revision ASC` (las más atrasadas primero).
  - Fallback a `pickAnyQuestions` si no hay suficientes preguntas con revisión pendiente.
- `generateTestSchema`: `modo` extendido con `'repaso'` (enum `'normal' | 'adaptativo' | 'repaso'`).
- `testService.generate`: si `modo === 'repaso'`, llama a `pickDueQuestions` (ignora dificultad — revisa lo que toca).
- Nuevo endpoint `GET /stats/repaso?tema_id=N` devolviendo `{ pendientes: N }` — preguntas con revisión vencida para el usuario en ese tema.

### P1 — Frontend: Modo Repaso en `HomePage` + contador en `ProgressPage` (PR 04)
- `HomePage.jsx`: opción `'repaso'` en el selector de modo; selector de dificultad deshabilitado en modo repaso (no aplica).
- `testApi.js`: método `repasoStats(token, temaId)` → `GET /stats/repaso?tema_id=N`.
- `ProgressPage.jsx`: al seleccionar tema, mostrar badge `N pendientes de repaso` junto a las stats del tema.

## Fuera de alcance en este sprint
- Repaso cross-tema o cross-materia (revisar todo lo pendiente de una oposición de golpe).
- SM-2 con factor de facilidad por pregunta — se mantiene intervalo fijo simplificado.
- Notificaciones push o email cuando hay preguntas pendientes.
- Decay automático: si no se hace repaso durante muchos días, el nivel no baja automáticamente.

## Criterios de Done
- Cada respuesta (acierto o fallo) en un submit actualiza `repeticion_espaciada` correctamente.
- El modo repaso genera un test con las preguntas con `proxima_revision <= NOW()` para ese usuario+tema, ordenadas de más atrasada a más reciente.
- El endpoint `/stats/repaso` devuelve el conteo correcto de pendientes.
- `ProgressPage` muestra el número de preguntas pendientes de repaso al consultar un tema.
- CI en verde: `test-backend` y `build-frontend`.
- Tests unitarios para: `upsertRepaso` (lógica de intervalos), `pickDueQuestions` (exportado), schema `modo 'repaso'`.

## Riesgos
- Riesgo: la tabla `repeticion_espaciada` crece a razón de 1 fila por (usuario, pregunta) única respondida — en un banco de 10.000 preguntas y 1.000 usuarios, ~10M filas en el caso extremo.
  - Mitigación: índice `(usuario_id, proxima_revision)` cubre la consulta principal. En fases posteriores añadir particionado por `usuario_id`.
- Riesgo: fire-and-forget post-COMMIT podría perder algunos registros si el proceso cae justo entre COMMIT y el upsert.
  - Mitigación: aceptable para MVP — en Sprint 7 se puede mover a una cola interna si la fiabilidad es crítica.
- Riesgo: el modo `'repaso'` con pocos tests previos devuelve 0 preguntas pendientes (usuario nuevo).
  - Mitigación: fallback a `pickAnyQuestions` si `pickDueQuestions` devuelve menos preguntas de las solicitadas.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | DB | Tabla `repeticion_espaciada` + índices |
| 02 | Backend | `spacedRepetitionRepository` + upsert post-submit |
| 03 | Backend | `pickDueQuestions` + modo `'repaso'` en schema y service + endpoint `/stats/repaso` |
| 04 | Frontend | Opción repaso en `HomePage` + contador pendientes en `ProgressPage` |

## Trazabilidad de PR ejecutados (Sprint 6)

| PR | Sprint | Objetivo principal | Estado |
|---|---|---|---|
| 01 | Sprint 6 | Tabla `repeticion_espaciada` + índices `idx_repaso_usuario_proxima` e `idx_repaso_pregunta` | Completado |
| 02 | Sprint 6 | `spacedRepetitionRepository.upsertRepaso` + fire-and-forget en `testService.submit` | Completado |
| 03 | Sprint 6 | `pickDueQuestions` + `countDueQuestions` en `testRepository`; `modo: 'repaso'` en schema y service; `GET /stats/repaso` | Completado |
| 04 | Sprint 6 | Frontend: opción repaso en `HomePage`; dificultad deshabilitada en repaso; `repasoStats` en `testApi`; contador pendientes en `ProgressPage`; `MODO_LABEL` repaso en `ResultPage` | Completado |

