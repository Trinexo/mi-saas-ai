# Sprint 5 — PR 01 — Body

## Resumen
PR 01 de Sprint 5 para añadir los índices en base de datos necesarios para que las consultas de generación adaptativa sean eficientes, y para implementar `pickAdaptiveQuestions` en el repositorio de tests con scoring SQL basado en el historial de respuestas del usuario.

## Qué cambia

### Base de datos (`database/schema.sql`)
- Nuevo índice `idx_respuestas_usuario_scoring`:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_scoring
    ON respuestas_usuario(pregunta_id, correcta, fecha_respuesta DESC);
  ```
  Cubre el JOIN de scoring por pregunta: filtro por `pregunta_id`, lectura de `correcta` y ordenación por recencia.

- Nuevo índice `idx_tests_usuario_tema`:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_tests_usuario_tema
    ON tests(usuario_id, tema_id, fecha_creacion DESC);
  ```
  Cubre el filtro `usuario_id + tema_id` en la subquery de recencia.

### Backend (`backend/src/repositories/test.repository.js`)
- Nueva constante `SELECT_ADAPTIVE_QUESTIONS_SQL`:
  - `LEFT JOIN LATERAL` sobre `respuestas_usuario` para obtener el último resultado del usuario en cada pregunta del tema.
  - Scoring inline:
    - `+3` si la última respuesta fue incorrecta (`correcta = false`)
    - `-1` si la última respuesta fue correcta
    - `0` si nunca fue respondida (NULL)
    - `-2` adicional si la última respuesta fue en los últimos 7 días
  - `ORDER BY score DESC, RANDOM()` para que preguntas falladas salgan primero y haya variedad dentro de mismo score.
  - Excluye IDs pasados en `$3` (igual que `pickFreshQuestions`).

- Nuevo método `pickAdaptiveQuestions({ userId, temaId, numeroPreguntas, excludePreguntaIds })`.

## Alcance
- Solo base de datos y repositorio. El servicio y el schema se tocan en PR 02.
- Compatibilidad total con los métodos existentes (`pickFreshQuestions`, `pickAnyQuestions`).

## Fuera de alcance
- Cambios en endpoint o schema Zod.
- Frontend.
- Algoritmo de repetición espaciada con intervalos.

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] docs
- [ ] test
- [ ] chore

## Checklist
- [ ] PR hacia main
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Índices en `database/schema.sql` con `IF NOT EXISTS`
- [ ] `pickAdaptiveQuestions` exportado desde `testRepository`
- [ ] Sin cambios en API pública del endpoint `/tests/generate`

## Validación local
- Verificar que la consulta adaptativa devuelve primero las preguntas falladas en un dataset con historial conocido.
- `node --test backend/tests/services/critical-services.test.js` sigue en verde.
- Build frontend sin cambios.
