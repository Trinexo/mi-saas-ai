# Sprint 7 — Inicio

Fecha: 14 de marzo de 2026
Estado: en curso

## Objetivo del sprint
Implementar el Modo Simulacro: examen oficial completo seleccionado por oposición (sin bajarse a tema individual), con tiempo límite visible, auto-submit al vencer el cronómetro, y acceso al historial de simulacros realizados.

## Base técnica disponible
- `modo: 'normal' | 'adaptativo' | 'repaso'` en schema + service (Sprints 5-6)
- `pickAdaptiveQuestions` + `pickFreshQuestions` + `pickDueQuestions` — tres estrategias de selección (Sprints 5-6)
- `dificultad` con distribución 40/30/30 (Sprint 5 PR 03)
- Tabla `tests` con `tipo_test` + `estado` — base para diferenciar simulacros (Sprint 3)
- `resultados_test` con `nota` + `tiempo_segundos` — almacenamiento de resultados (Sprint 3)
- `TestPage.jsx` — interfaz de test ya funcional (Sprint 3)
- Pattern `runAction` + `useAsyncAction` — manejo de async en frontend (Sprint 3)

## Alcance comprometido

### P0 — Ampliar tabla `tests` para simulacros (PR 01)
- `tema_id` pasa a nullable: los simulacros no son de un tema sino de una oposición completa.
- Nueva columna `oposicion_id BIGINT REFERENCES oposiciones(id)` (nullable — solo en simulacros).
- Nueva columna `duracion_segundos INTEGER` (nullable — NULL = sin límite de tiempo).
- Nuevo índice `idx_tests_usuario_oposicion` para la consulta de historial por usuario + oposición.

### P0 — `pickSimulacroQuestions` + `modo: 'simulacro'` en schema y service (PR 02)
- Nuevo método `testRepository.pickSimulacroQuestions({ userId, oposicionId, numeroPreguntas })`:
  - JOIN `preguntas → temas → materias` filtrando por `oposicion_id`.
  - Distribución proporcional de preguntas por materia (evita que una materia acapare el test).
  - Fallback a selección sin distribución si el banco de una materia es insuficiente.
- `generateTestSchema`: nueva variante para simulacro — acepta `oposicionId` (en lugar de `temaId`) + `duracionSegundos` opcional.
- `testService.generate`: rama `if (modo === 'simulacro')` → llama `pickSimulacroQuestions`, usa `oposicion_id` y `tipo_test = 'simulacro'` al crear el test.
- `testRepository.createTest` extendido para aceptar `oposicionId` y `duracionSegundos`.
- La respuesta de `generate` incluye `duracionSegundos` cuando aplica.

### P1 — Endpoint `GET /stats/simulacros` (PR 03)
- `GET /stats/simulacros?oposicion_id=N` — historial de simulacros del usuario en esa oposición.
- Devuelve array ordenado por fecha DESC: `[{ testId, fecha, nota, aciertos, errores, blancos, duracionSegundos, tiempoRealSegundos }]`.
- Permite al usuario ver su evolución de notas a lo largo del tiempo.

### P1 — Frontend: sección simulacro + countdown (PR 04)
- `HomePage.jsx`: nueva sección separada "Simulacro" — selecciona oposición directamente (sin bajar a materia/tema); muestra nº preguntas por defecto según la oposición; campo opcional de duración.
- `TestPage.jsx`: si `active_test.duracionSegundos` está presente → muestra countdown; al llegar a 0 hace auto-submit con las respuestas actuales.
- `ResultPage.jsx`: badge `Simulacro` en `MODO_LABEL`; enlace "Ver historial de simulacros" cuando el test fue un simulacro.

## Fuera de alcance en este sprint
- Simulacros oficiales con banco de preguntas real (requiere contenido curado).
- Notificaciones o recordatorios de simulacro programado.
- Comparativa con otros usuarios (ranking).
- Restricción de acceso por plan de suscripción (se añadirá en Sprint de monetización).

## Criterios de Done
- Un test con `modo: 'simulacro'` se genera correctamente usando preguntas de toda la oposición.
- La tabla `tests` almacena `oposicion_id` y `duracion_segundos` para los simulacros.
- `GET /stats/simulacros` devuelve el historial correcto para el usuario autenticado.
- `TestPage` muestra countdown y hace auto-submit cuando se acaba el tiempo.
- CI en verde: `test-backend` y `build-frontend`.
- Tests unitarios para: schema PR 01, `pickSimulacroQuestions` exportado, schema `modo 'simulacro'`.

## Riesgos
- Riesgo: `pickSimulacroQuestions` con distribución proporcional es compleja si el banco no está equilibrado entre materias.
  - Mitigación: fallback a selección aleatoria sin restricción por materia si alguna materia queda corta.
- Riesgo: `tema_id NOT NULL` en tests existentes — el cambio es retrocompatible porque es un `CREATE TABLE IF NOT EXISTS`; en producción requerirá una migración `ALTER TABLE tests ALTER COLUMN tema_id DROP NOT NULL; ADD COLUMN oposicion_id ...; ADD COLUMN duracion_segundos ...`.
  - Mitigación: documentar la migración SQL necesaria.
- Riesgo: auto-submit en `TestPage` al llegar a 0 puede sorprender al usuario si no ve el contador.
  - Mitigación: mostrarlo de forma prominente con alertas visuales cuando queden ≤60 segundos.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | DB | `tema_id` nullable + `oposicion_id` + `duracion_segundos` en `tests` + índice |
| 02 | Backend | `pickSimulacroQuestions` + `modo: 'simulacro'` en schema y service |
| 03 | Backend | `GET /stats/simulacros?oposicion_id=N` — historial del usuario |
| 04 | Frontend | Sección simulacro en `HomePage` + countdown + auto-submit en `TestPage` |

## Trazabilidad de PR ejecutados (Sprint 7)

| PR | Sprint | Objetivo principal | Estado |
|---|---|---|---|
| 01 | Sprint 7 | `tema_id` nullable + `oposicion_id` + `duracion_segundos` + `idx_tests_usuario_oposicion` en schema.sql | Completado |
| 02 | Sprint 7 | `pickSimulacroQuestions` (distribución proporcional por materia) + `modo: 'simulacro'` en schema con superRefine + routing en service | Completado |
| 03 | Sprint 7 | `GET /stats/simulacros?oposicion_id=N` + `simulacrosStatsQuerySchema` + `getSimulacrosStats` en repo/service/controller/routes (5 tests, suite 106 pass) | Completado |
| 04 | Sprint 7 | Frontend: sección simulacro en `HomePage` + countdown+auto-submit en `TestPage` + badge Simulacro en `ResultPage` + `simulacroStats()` en `testApi.js` (vite build ✓) | Completado |
