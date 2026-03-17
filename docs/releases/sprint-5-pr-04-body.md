# Sprint 5 — PR 04 — Body

## Resumen
PR 04 de Sprint 5 para actualizar el frontend con el selector de modo (Normal / Adaptativo) y selector de dificultad (Mixta / Fácil / Media / Difícil) en la pantalla de generación, y añadir un indicador visual del modo activo en la pantalla de resultados.

## Qué cambia

### Frontend — `frontend/src/services/testApi.js`
- `generate(token, { temaId, numeroPreguntas, modo, dificultad })`: pasa los nuevos campos al backend.
- Los campos son opcionales desde el frontend — si no se envían, el backend aplica los defaults.

### Frontend — `frontend/src/pages/HomePage.jsx`
- Estado `selection` añade `modo: 'adaptativo'` y `dificultad: 'mixto'` como valores iniciales.
- Nuevo control visual `<select>` para modo:
  - opción `adaptativo` → "Adaptativo (prioriza tus fallos)" (seleccionada por defecto)
  - opción `normal` → "Normal (aleatorio)"
- Nuevo control visual `<select>` para dificultad:
  - opción `mixto` → "Mixta (40% media, 30% fácil, 30% difícil)" (seleccionada por defecto)
  - opciones `media`, `facil`, `dificil` con etiquetas legibles
- `onGenerate` pasa `modo` y `dificultad` al `testApi.generate`.
- El objeto `test` que devuelve el backend incluye `modo` → se persiste en `sessionStorage('active_test')`.

### Frontend — `frontend/src/pages/ResultPage.jsx`
- Lee `modo` del objeto de test guardado en `sessionStorage`.
- Badge/indicador pequeño en la cabecera:
  - Si `modo === 'adaptativo'`: "Modo adaptativo" con estilo destacado.
  - Si `modo === 'normal'`: "Modo normal" (neutro).
  - Si no hay `modo` (tests generados antes de este PR): sin indicador (compatibilidad).

## Alcance
- Solo cambios de presentación y paso de parámetros. Cero lógica de negocio en frontend.
- Totalmente compatible hacia atrás: si el backend no devuelve `modo`, el frontend lo omite sin errores.

## Fuera de alcance
- Tests unitarios de componentes React.
- Cambios en `TestPage.jsx`.
- Historial de tests del usuario con modo vinculado.

## Tipo de cambio
- [x] feat
- [ ] fix
- [ ] docs
- [ ] test
- [ ] chore

## Checklist
- [ ] PR hacia main
- [ ] CI en verde (`test-backend`, `build-frontend`)
- [ ] Default modo `adaptativo` en el selector
- [ ] Default dificultad `mixto` en el selector
- [ ] `sessionStorage` persiste `modo` para que `ResultPage` pueda leerlo
- [ ] Sin errores si `modo` no viene del backend (compatibilidad)

## Validación local
- Seleccionar modo "Normal" → test generado sin scoring adaptativo.
- Seleccionar modo "Adaptativo" → al repetir test en tema con fallos, las preguntas falladas aparecen primero.
- Seleccionar dificultad "Media" → todas las preguntas son de nivel 2.
- Pantalla de resultados muestra el indicador de modo correcto.
- Build frontend: `node node_modules/vite/bin/vite.js build` en verde.
