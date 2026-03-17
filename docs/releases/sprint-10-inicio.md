# Sprint 10 — Inicio

Fecha: 14 de marzo de 2026
Estado: completado

## Objetivo del sprint
Cerrar el loop de estudio: el usuario puede generar un test exclusivamente con sus preguntas marcadas, y puede ver en un único panel un resumen de su rendimiento global (tests completados, nota media, mejor simulacro, preguntas pendientes de repaso).

## Base técnica disponible
- `preguntas_marcadas` — tabla con `(usuario_id, pregunta_id, fecha_marcado)` (Sprint 9 PR 01)
- `marcadasRepository.getMarcadas(userId)` — lista preguntas marcadas con enunciado y tema (Sprint 9 PR 01)
- `modo: 'normal' | 'adaptativo' | 'repaso' | 'simulacro'` — motor de generación existente (Sprints 5-7)
- `pickFreshQuestions` / `pickAdaptiveQuestions` / `pickDueQuestions` / `pickSimulacroQuestions` — cuatro estrategias de selección (Sprints 5-7)
- `repeticion_espaciada` — tabla con `proxima_revision` por usuario+pregunta (Sprint 6)
- `resultados_test` — almacena `nota`, `aciertos`, `errores`, `blancos`, `tiempo_segundos` (Sprint 3)
- `testService.submit` — guarda respuestas y actualiza `repeticion_espaciada` (Sprints 3, 6)
- `MarcadasPage.jsx` + `marcadasApi.js` — frontend de preguntas marcadas (Sprint 9 PR 02)
- `ProfilePage.jsx` — página de perfil del usuario (Sprint 9 PR 03)
- `ProgressPage.jsx` — estadísticas por tema, historial simulacros (Sprints 4, 7, 8)

## Alcance comprometido

### P0 — Modo `'marcadas'` en el motor de generación (PR 01 — Backend)

**DB / schema:**
- No se requiere nueva tabla. Solo uso de `preguntas_marcadas` ya existente.

**`test.repository.js` — nuevo método `pickMarcadasQuestions`:**
```sql
SELECT p.id
FROM preguntas_marcadas pm
JOIN preguntas p ON p.id = pm.pregunta_id
WHERE pm.usuario_id = $1
ORDER BY RANDOM()
LIMIT $2
```
- Si el usuario tiene menos preguntas marcadas que `numeroPreguntas` solicitadas, devuelve todas las disponibles (sin completar con otras).
- Devuelve mínimo 1 pregunta; si 0 marcadas → `ApiError(400, 'No tienes preguntas marcadas')`.

**`generateTestSchema` — extensión del enum `modo`:**
- Añade `'marcadas'` al enum: `z.enum(['normal', 'adaptativo', 'repaso', 'simulacro', 'marcadas'])`.
- En modo `'marcadas'`, `temaId` pasa a ser **opcional** (puede no indicarse — el test abarca todas las marcadas del usuario independientemente del tema).
- Ajuste en `superRefine`: el bloque que exige `temaId` para modos no-simulacro queda condicionado a `modo !== 'marcadas'`.

**`testService.generate` — nueva rama:**
```js
if (modo === 'marcadas') {
  preguntas = await testRepository.pickMarcadasQuestions(userId, numeroPreguntas);
  // tipo_test = 'normal', sin oposicion_id ni duracion_segundos
}
```

**Response de `POST /tests/generate`:**
- Incluye `modo: 'marcadas'` en el objeto devuelto para que el frontend pueda diferenciarlo.

**Tests (profile.test.js en adelante → nuevo fichero `marcadas-mode.test.js`):**
- `generateTestSchema` acepta `modo: 'marcadas'` sin `temaId`.
- `generateTestSchema` rechaza `modo: 'marcadas'` con `temaId` explícito (campo irrelevante — no error, simplemente se ignora — test de que no rompe).
- `pickMarcadasQuestions` está exportado.
- `testService.generate` está exportado.

### P0 — Integración frontend del modo marcadas (PR 02 — Frontend)

**`testApi.js`:**
- `generate` ya acepta `modo: 'marcadas'`; solo necesita pasarlo al `POST /tests/generate` sin `temaId`.

**`MarcadasPage.jsx` — botón "Practicar marcadas":**
- Añadir botón "▶ Practicar" en la cabecera de la página.
- Al hacer clic llama a `testApi.generate(token, { modo: 'marcadas', numeroPreguntas: Math.min(marcadas.length, 20) })`.
- Si el resultado es ok → navega a `/test` con el estado del test (igual que `HomePage`).
- Si 0 marcadas → el botón está deshabilitado con tooltip "Marca primero alguna pregunta".

**`HomePage.jsx`:**
- Añadir opción `'marcadas'` al selector de modo (label: "Desde preguntas marcadas").
- Cuando modo = `'marcadas'`: selector de tema deshabilitado + selector de dificultad deshabilitado.
- La generación se lanza sin `temaId`.

**`ResultPage.jsx`:**
- `MODO_LABEL` extendido: `marcadas: 'Preguntas marcadas'`.

### P1 — Endpoint `GET /stats/dashboard` + widget en perfil (PR 03 — Backend + Frontend)

**Backend — `statsRepository.getDashboard(userId)`:**
```sql
-- Total tests completados
SELECT COUNT(*) FROM tests WHERE usuario_id=$1 AND estado='finalizado'

-- Nota media global (todos los tests)
SELECT ROUND(AVG(nota)::numeric, 1) FROM resultados_test rt
JOIN tests t ON t.id = rt.test_id WHERE t.usuario_id=$1

-- Mejor nota en simulacro
SELECT MAX(nota) FROM resultados_test rt
JOIN tests t ON t.id = rt.test_id WHERE t.usuario_id=$1 AND t.tipo_test='simulacro'

-- Preguntas pendientes de repaso (proxima_revision <= NOW())
SELECT COUNT(*) FROM repeticion_espaciada
WHERE usuario_id=$1 AND proxima_revision <= NOW()

-- Total preguntas marcadas
SELECT COUNT(*) FROM preguntas_marcadas WHERE usuario_id=$1
-- Retorna un solo objeto { totalTests, notaMedia, mejorSimulacro, pendientesRepaso, totalMarcadas }
```
- Usa una sola query con CTEs para eficiencia.
- `statsController.getDashboard` + ruta `GET /stats/dashboard` (requireAuth, sin parámetros).

**Tests — `dashboard.test.js`:**
- `getDashboard` exportado en `statsRepository`.
- `getDashboard` exportado en `statsService`.

**Frontend — `statsApi.js` (ya existe, añadir método) + `DashboardWidget.jsx`:**
- `statsApi.getDashboard(token)` → `GET /stats/dashboard`.
- Nuevo componente `DashboardWidget.jsx` en `components/`:
  - 5 tarjetas en fila: Tests completados / Nota media / Mejor simulacro / Pendientes de repaso / Marcadas.
  - Diseño simple con número grande + etiqueta.
  - Enlace desde "Pendientes de repaso" → `/progreso` | desde "Marcadas" → `/marcadas`.
- Integrar `DashboardWidget` en la parte superior de `ProfilePage.jsx` (carga al montar, independiente del formulario).

## Fuera de alcance en este sprint
- Desmarcar automáticamente una pregunta cuando se responde correctamente (puede añadirse en sprint posterior como opción configurable).
- Filtrar "practicar marcadas" por tema o materia.
- Suscripciones / planes de pago (Sprint dedicado).
- Charts/gráficas de evolución temporal de la nota (requiere librería de gráficos).
- Exportar estadísticas a PDF.

## Criterios de Done
- Un usuario con preguntas marcadas puede generar un test de modo `'marcadas'` desde `MarcadasPage` o `HomePage` sin indicar tema.
- Un usuario sin preguntas marcadas ve el botón deshabilitado en `MarcadasPage` y al seleccionar el modo en `HomePage` se deshabilitan los selectores no aplicables.
- `GET /stats/dashboard` devuelve el resumen global del usuario en una sola petición.
- `DashboardWidget` se muestra en la parte superior de `ProfilePage` con los 5 indicadores.
- Suite backend sin regresiones (≥137 pass, 0 fail).
- `vite build` sin errores.

## Riesgos
- El banco de preguntas marcadas puede ser muy pequeño; mitigado devolviendo todas las disponibles sin rellenar.
- La query de dashboard con múltiples CTEs puede ser lenta si `respuestas_usuario` es muy grande; se puede cachear o limitar en sprint posterior.

## PRs planificados

| PR | Área | Objetivo |
|---|---|---|
| 01 | Backend | `modo: 'marcadas'` en `generateTestSchema` + `pickMarcadasQuestions` + `testService.generate` nueva rama + tests |
| 02 | Frontend | Botón "Practicar" en `MarcadasPage` + opción marcadas en `HomePage` + `ResultPage` label |
| 03 | Backend + Frontend | `GET /stats/dashboard` + `DashboardWidget` en `ProfilePage` |

## Trazabilidad de PR ejecutados (Sprint 10)

| PR | Sprint | Objetivo principal | Estado |
|---|---|---|---|
| 01 | Sprint 10 | `modo: 'marcadas'` en `generateTestSchema` (enum 5 valores) + `pickMarcadasQuestions` en `testRepository` + rama `marcadas` en `testService.generate` (9 tests, suite 148 pass / 0 fail) | Completado |
| 02 | Sprint 10 | Botón "▶ Practicar" en `MarcadasPage` + opción "Desde preguntas marcadas" en `HomePage` (selectores oposición/materia/tema deshabilitados) + `MODO_LABEL.marcadas` en `ResultPage` (vite build ✓) | Completado |
| 03 | Sprint 10 | `getDashboard` CTE en `statsRepository` + `statsService` + `GET /stats/dashboard` en `stats.routes` + `DashboardWidget.jsx` con 5 KPIs + integrado en `ProfilePage` + `testApi.getDashboard` (2 tests, suite 148 pass / 0 fail, vite build ✓) | Completado |
