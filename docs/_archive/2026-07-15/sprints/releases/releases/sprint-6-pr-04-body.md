# Sprint 6 — PR 04 — Frontend: Modo Repaso + contador pendientes en ProgressPage

Sprint: 6
Fecha: 13 de marzo de 2026
Estado: pendiente

## Qué cambia

### `frontend/src/services/testApi.js`
- Nuevo método `repasoStats(token, temaId)` → `GET /stats/repaso?tema_id={temaId}`.

### `frontend/src/pages/HomePage.jsx`
- Opción `repaso` añadida al selector de modo: `Repaso (preguntas pendientes)`.
- Selector de dificultad deshabilitado cuando `modo === 'repaso'` (no aplica a repaso).

### `frontend/src/pages/ProgressPage.jsx`
- Al seleccionar un tema, además de cargar `temaStats`, llama a `testApi.repasoStats(token, selTema)`.
- Muestra badge `{pendientes} pendientes de repaso` junto a las stats del tema.
- Badge solo visible si `pendientes > 0`.

## Alcance
- Sin cambios en el flujo de generación (ya maneja `modo: 'repaso'` desde PR 03).
- `ResultPage.jsx`: el badge de modo mostrará `Repaso` — ya funciona con `MODO_LABEL` existente (se añade entrada).

## Fuera de alcance
- Enlace directo "Repasar ahora" desde `ProgressPage` (genera test en modo repaso con el tema ya seleccionado).
- Notificación visual en el menú principal cuando hay pendientes.

## Validación local
- Seleccionar modo `Repaso` en `HomePage` — selector dificultad deshabilitado.
- Generar test en modo repaso — se genera correctamente.
- En `ProgressPage`, seleccionar tema con preguntas pendientes → badge visible con el conteo correcto.
- Badge no aparece si `pendientes === 0`.
