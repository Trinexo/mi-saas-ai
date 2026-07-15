# Sprint 6 — PR 03 — `pickDueQuestions` + modo `'repaso'` + endpoint `/stats/repaso`

Sprint: 6
Fecha: 13 de marzo de 2026
Estado: pendiente

## Qué cambia

### `backend/src/repositories/test.repository.js`
- Nueva constante SQL `SELECT_DUE_QUESTIONS_SQL`:
  - JOIN con `repeticion_espaciada` WHERE `usuario_id = $2` AND `proxima_revision <= NOW()`
  - ORDER BY `proxima_revision ASC` (las más atrasadas primero)
  - LIMIT `$3`
- Nuevo método `pickDueQuestions({ userId, temaId, numeroPreguntas })`.

### `backend/src/schemas/test.schema.js`
- `modo` extendido: `z.enum(['normal', 'adaptativo', 'repaso'])`.

### `backend/src/services/test.service.js`
- En `generate`: si `modo === 'repaso'`, llama a `pickDueQuestions` ignorando el campo `dificultad`.
- Fallback a `pickAnyQuestions` si hay menos preguntas pendientes que `numeroPreguntas`.

### `backend/src/routes/stats.routes.js` + `backend/src/controllers/stats.controller.js` + `backend/src/services/stats.service.js`
- Nuevo endpoint `GET /stats/repaso?tema_id=N`:
  - Devuelve `{ pendientes: N }` — preguntas con `proxima_revision <= NOW()` para el usuario en ese tema.
  - Requiere autenticación, `tema_id` obligatorio.

## Alcance
- El modo `'repaso'` ignora el campo `dificultad` — distribuye lo que toca revisar tal cual.
- Un usuario sin historial de repaso ve `pendientes: 0` y recibe el fallback normal.

## Fuera de alcance
- Repaso global multi-tema.
- Priorización por `racha_aciertos` dentro del modo repaso.

## Tests nuevos
- `backend/tests/services/test-repaso-schema.test.js`:
  - `modo 'repaso' es válido en generateTestSchema`
  - `modo desconocido lanza ZodError`
- `backend/tests/services/test-repaso-repository.test.js`:
  - `pickDueQuestions está exportado desde testRepository`
  - `pickDueQuestions acepta userId, temaId, numeroPreguntas`

## Validación local
- `POST /tests/generate` con `{ modo: 'repaso', temaId: 1, numeroPreguntas: 5 }` → devuelve preguntas con `proxima_revision <= NOW()`.
- `GET /stats/repaso?tema_id=1` → `{ pendientes: N }`.
