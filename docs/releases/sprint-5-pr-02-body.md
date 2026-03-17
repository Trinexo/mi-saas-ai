# Sprint 5 — PR 02 — Body

## Resumen
PR 02 de Sprint 5 para exponer el modo de generación en el endpoint `POST /tests/generate`: añadir el campo `modo` al schema Zod, enrutar en el servicio entre `pickAdaptiveQuestions` (modo adaptativo) y `pickFreshQuestions` (modo normal), y cubrir con tests de schema y de service.

## Qué cambia

### Backend — Schema (`backend/src/schemas/test.schema.js`)
- `generateTestSchema` añade campo opcional `modo`:
  ```js
  modo: z.enum(['normal', 'adaptativo']).optional().default('adaptativo'),
  ```
  Default `'adaptativo'` — compatibilidad hacia atrás total: clientes que no envíen el campo reciben comportamiento adaptativo automáticamente.

### Backend — Service (`backend/src/services/test.service.js`)
- `testService.generate` recibe `modo` del payload validado.
- Si `modo === 'adaptativo'`:
  1. Intenta `pickAdaptiveQuestions` → prioriza preguntas falladas.
  2. Si no hay suficientes, completa con `pickAnyQuestions` (excluyendo las ya seleccionadas).
- Si `modo === 'normal'`:
  1. Intenta `pickFreshQuestions` → excluye las últimas 200 vistas aleatoriamente.
  2. Si no hay suficientes, completa con `pickAnyQuestions`.
- Si después de los dos pasos no hay suficientes preguntas en ningún modo → `ApiError(400, ...)` igual que antes.
- La respuesta incluye `modo` para que el frontend pueda mostrarlo.

### Controller (`backend/src/controllers/test.controller.js`)
- `generateTest` extrae `modo` del payload sin cambios adicionales (el servicio lo gestiona).

### Backend — Tests
- `tests/services/test-generate-schema.test.js` (nuevo):
  - acepta sin `modo` (usa default `'adaptativo'`)
  - acepta `modo: 'normal'`
  - acepta `modo: 'adaptativo'`
  - rechaza `modo: 'turbo'` (valor inválido)

- `tests/services/test-generate-service.test.js` (nuevo):
  - modo `'adaptativo'` llama `pickAdaptiveQuestions` primero
  - modo `'normal'` llama `pickFreshQuestions` primero
  - fallback activo cuando la primera fase devuelve menos preguntas de las pedidas
  - error cuando el fallback tampoco alcanza

## Alcance
- Schema, service y tests. Sin cambios de frontend.
- Respuesta del endpoint incluye `modo` para permitir al frontend mostrar indicador.

## Fuera de alcance
- Distribución de dificultad (se añade en PR 03).
- Cambios en `POST /tests/submit`.
- Frontend.

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] docs
- [x] test
- [ ] chore

## Checklist
- [ ] PR hacia main
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] `modo` en respuesta de `generate` para consumo frontend
- [ ] Default `'adaptativo'` — sin ruptura de clientes actuales
- [ ] Tests nuevos añadidos a `test:all` en `package.json`

## Validación local
- Generar test sin `modo` → comportamiento adaptativo.
- Generar test con `modo: 'normal'` → comportamiento anterior.
- `node --test tests/services/test-generate-schema.test.js tests/services/test-generate-service.test.js`
- Suite completa en verde.
- Build frontend sin cambios.
