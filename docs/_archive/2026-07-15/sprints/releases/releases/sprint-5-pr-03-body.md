# Sprint 5 — PR 03 — Body

## Resumen
PR 03 de Sprint 5 para añadir distribución configurable de dificultad en la generación de tests. El campo `dificultad` acepta `'facil'`, `'media'`, `'dificil'` o `'mixto'`. En modo `'mixto'` se aplica la distribución recomendada por el producto: 40 % media, 30 % fácil, 30 % difícil (con fallback graceful si no hay suficientes de un nivel).

## Qué cambia

### Base de datos — Índice complementario (`database/schema.sql`)
- Nuevo índice `idx_preguntas_tema_dificultad`:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_preguntas_tema_dificultad
    ON preguntas(tema_id, nivel_dificultad);
  ```
  Cubre el filtro `tema_id + nivel_dificultad` que se añade en las consultas adaptativas con dificultad.

### Backend — Schema (`backend/src/schemas/test.schema.js`)
- `generateTestSchema` añade campo opcional `dificultad`:
  ```js
  dificultad: z.enum(['facil', 'media', 'dificil', 'mixto']).optional().default('mixto'),
  ```
  Los valores se mapean internamente a `nivel_dificultad`: `facil=1`, `media=2`, `dificil=3`.

### Backend — Repository (`backend/src/repositories/test.repository.js`)
- `pickAdaptiveQuestions` y `pickAnyQuestions` aceptan parámetro opcional `nivelDificultad`:
  - Si se pasa, añade `AND p.nivel_dificultad = $N` a la query.
  - Si es `null`, sin filtro (comportamiento actual).

### Backend — Service (`backend/src/services/test.service.js`)
- `testService.generate` recibe `dificultad` del payload validado.
- Lógica de distribución para `'mixto'` (reusable como función privada `distribuirPorDificultad`):
  ```
  media  = Math.round(numeroPreguntas * 0.40)
  facil  = Math.round(numeroPreguntas * 0.30)
  dificil = numeroPreguntas - media - facil
  ```
- Para cada segmento: llama al selector (adaptativo o normal según `modo`) con `nivelDificultad`.
- Fallback graceful: si un nivel no tiene suficientes, los faltantes se piden sin filtro de dificultad.
- Para `'facil'`, `'media'` o `'dificil'`: único selector con ese nivel, sin distribución.

### Backend — Tests
- `tests/services/test-dificultad-schema.test.js` (nuevo):
  - acepta sin `dificultad` (usa default `'mixto'`)
  - acepta cada valor válido
  - rechaza valor inválido `'extrema'`

- `tests/services/test-dificultad-service.test.js` (nuevo):
  - distribución `'mixto'` llama al selector 3 veces con los niveles correctos
  - distribución `'facil'` llama al selector una sola vez con `nivelDificultad=1`
  - fallback activa cuando un nivel no tiene preguntas suficientes

## Alcance
- Schema, repository, service y tests. Sin cambios de frontend (PR 04).
- Compatible con modo `'normal'` y `'adaptativo'`.

## Fuera de alcance
- Frontend.
- Distribución por oposición completa (multi-tema).
- Balanceo automático de dificultad en función del rendimiento histórico.

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] docs
- [x] test
- [ ] chore

## Checklist
- [ ] PR hacia main
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Default `'mixto'` — sin ruptura de clientes actuales
- [ ] Fallback graceful documentado en el código
- [ ] Índice en `database/schema.sql` con `IF NOT EXISTS`
- [ ] Tests nuevos añadidos a `test:all` en `package.json`

## Validación local
- Generar test sin `dificultad` → distribución mixta (verificar `nivel_dificultad` en preguntas devueltas).
- Generar test con `dificultad: 'media'` → solo preguntas de nivel 2.
- `node --test tests/services/test-dificultad-schema.test.js tests/services/test-dificultad-service.test.js`
- Suite completa en verde.
