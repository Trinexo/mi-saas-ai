# Sprint 8 — Inicio

Fecha: 14 de marzo de 2026
Estado: en curso

## Objetivo del sprint
Cerrar el ciclo de aprendizaje post-test: permitir al usuario revisar cada pregunta del examen (con su respuesta, la correcta y la explicación), y ver el historial de sus simulacros directamente en la pantalla de progreso.

## Base técnica disponible
- `respuestas_usuario` — almacena la opción elegida por el usuario y si fue correcta (Sprints 3-4)
- `tests_preguntas` — relación test ↔ pregunta con orden (Sprint 3)
- `preguntas.explicacion` + `preguntas.referencia_normativa` — ya existen en el schema (Sprint 3)
- `testService.submit` — guarda todas las respuestas antes del COMMIT (Sprint 3)
- `GET /stats/simulacros` — historial de simulacros por usuario+oposición (Sprint 7 PR 03)
- `testApi.simulacroStats()` ya implementado en el frontend (Sprint 7 PR 04)
- `ProgressPage.jsx` con selectores oposición/materia/tema (Sprint 4)
- `ResultPage.jsx` con enlace "Ver historial de simulacros" → `/progreso` (Sprint 7 PR 04)

## Alcance comprometido

### P0 — Endpoint `GET /tests/:testId/review` (PR 01)
- Nuevo método `testRepository.getTestReview(testId, userId)`:
  - Verifica que el test pertenece al usuario y está `finalizado`.
  - Devuelve para cada pregunta del test (en orden):
    - `enunciado`, `explicacion`, `referenciaNormativa`
    - Todas las opciones (`id`, `texto`, `correcta`)
    - `respuestaUsuarioId` — opción elegida por el usuario (null si fue en blanco)
    - `esCorrecta` — boolean de `respuestas_usuario.correcta`
- `reviewParamsSchema` — valida `testId` como entero positivo (params de ruta).
- `testService.getReview(userId, testId)` — llama al repository y lanza `ApiError 404` si el test no existe o no pertenece al usuario.
- `GET /tests/:testId/review` — ruta protegida con `requireAuth`.

### P0 — Frontend: `ReviewPage.jsx` (PR 02)
- Nueva ruta `/revision/:testId` en `App.jsx`.
- `ReviewPage.jsx`:
  - Lee `testId` de `:testId` en la URL (desde `useParams`).
  - Llama a `testApi.getReview(token, testId)` → `GET /tests/:testId/review`.
  - Muestra cada pregunta numerada con:
    - Enunciado.
    - Opciones coloreadas: la correcta en verde, la elegida por el usuario en rojo si fue incorrecta, en gris si fue en blanco.
    - Si hay `explicacion`, la muestra bajo las opciones en un bloque desplegable o directo.
    - Si hay `referenciaNormativa`, la muestra como nota al pie.
  - Paginación simple (1 pregunta a la vez con botones anterior/siguiente) o listado completo — se elige listado completo para maximizar visibilidad.
- `ResultPage.jsx`: añade botón/enlace `Ver revisión` → `/revision/:testId`.
- `testApi.js`: método `getReview(token, testId)` → `GET /tests/:testId/review`.

### P1 — Historial de simulacros en `ProgressPage` (PR 03)
- Nueva sección "Mis simulacros" en `ProgressPage.jsx`.
- Selector de oposición (reutiliza `oposiciones` ya cargado).
- Al seleccionar oposición: llama a `testApi.simulacroStats(token, oposicionId)`.
- Tabla con columnas: Fecha, Preguntas, Nota, Aciertos, Errores, Blancos, Tiempo.
- Si no hay simulacros: mensaje "Aún no has realizado ningún simulacro para esta oposición".

## Fuera de alcance en este sprint
- Marcado de preguntas favoritas o para repasar (requiere tabla nueva — Sprint futuro).
- Exportar revisión a PDF.
- Comparativa de simulacros con media de otros usuarios.
- Gráfico de evolución de notas de simulacro (puede venir en Sprint 9).

## Criterios de Done
- `GET /tests/:testId/review` devuelve las preguntas con opciones, respuesta del usuario y correcta.
- `ReviewPage` muestra correctamente las respuestas coloreadas y las explicaciones.
- `ResultPage` tiene enlace funcional a la revisión.
- `ProgressPage` muestra el historial de simulacros al seleccionar una oposición.
- Suite backend: sin regresiones (≥106 pass, 0 fail).
- `vite build` sin errores.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | `GET /tests/:testId/review` — preguntas+respuestas+explicaciones |
| 02 | Frontend | `ReviewPage.jsx` + ruta + enlace desde `ResultPage` |
| 03 | Frontend | Historial de simulacros en `ProgressPage` |

## Trazabilidad de PR ejecutados (Sprint 8)

| PR | Sprint | Objetivo principal | Estado |
|---|---|---|---|
| 01 | Sprint 8 | `GET /tests/:testId/review` + `reviewParamsSchema` + `getTestReview` en repo/service/controller/routes (6 tests, suite 112 pass) | Completado |
| 02 | Sprint 8 | `ReviewPage.jsx` (colores correcta/incorrecta/correcta-no-elegida + explicación + referencia) + ruta `/revision/:testId` + botón "Revisar respuestas" en `ResultPage` + `getReview()` en `testApi.js` (vite build ✓) | Completado |
| 03 | Sprint 8 | Historial de simulacros en `ProgressPage`: selector de oposición + tabla fecha/nota/aciertos/errores/blancos/tiempo + estado vacío (vite build ✓) | Completado |
