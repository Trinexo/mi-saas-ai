# Sprint 6 — PR 02 — `spacedRepetitionRepository` + upsert post-submit

Sprint: 6
Fecha: 13 de marzo de 2026
Estado: pendiente

## Qué cambia

### `backend/src/repositories/spacedRepetition.repository.js` (nuevo)
- Exporta `spacedRepetitionRepository` con método `upsertRepaso({ userId, preguntaId, correcta })`.
- Lógica de intervalos:
  | nivel_memoria actual | acción | nuevo nivel | intervalo |
  |---|---|---|---|
  | cualquiera | fallo | 0 | 1 día |
  | 0 | acierto | 1 | 1 día |
  | 1 | acierto | 2 | 3 días |
  | 2 | acierto | 3 | 7 días |
  | 3 | acierto | 4 | 14 días |
  | 4 | acierto | 4 (tope) | 30 días |
- `INSERT ... ON CONFLICT (usuario_id, pregunta_id) DO UPDATE SET nivel_memoria = ..., proxima_revision = ..., ultima_revision = NOW(), racha_aciertos = ...`

### `backend/src/services/test.service.js`
- En `submit`, después del `COMMIT`, fire-and-forget de `upsertRepaso` para cada respuesta del test:
  ```js
  respuestas.forEach(({ preguntaId, isCorrect }) => {
    spacedRepetitionRepository.upsertRepaso({ userId, preguntaId, correcta: isCorrect }).catch(() => {});
  });
  ```
- El resultado de submit no cambia — el upsert es asíncrono y no bloquea la respuesta.

## Alcance
- No afecta a los tests de `critical-services.test.js` existentes — el upsert es fire-and-forget.
- No cambia el contrato de la API de submit.

## Fuera de alcance
- Cola de reintentos si el upsert falla.
- Reducción de nivel por inactividad prolongada.

## Tests nuevos
- `backend/tests/services/spaced-repetition-repository.test.js`:
  - `upsertRepaso está exportado desde spacedRepetitionRepository`
  - `acierto desde nivel 0 sube a nivel 1`
  - `fallo desde cualquier nivel resetea a nivel 0`
  - `nivel_memoria no supera 4`
  - `el intervalo de nivel 4 es 30 días`

## Validación local
- Hacer un submit → verificar que `repeticion_espaciada` tiene filas con `proxima_revision` correcta.
- Hacer fallo en una pregunta ya en nivel 3 → verificar que `nivel_memoria = 0` y `proxima_revision = NOW() + 1 day`.
