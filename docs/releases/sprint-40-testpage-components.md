# Sprint 40 — Descomposición TestPage en componentes presentacionales

## Objetivo

Reducir `TestPage.jsx` de 187 a 111 líneas extrayendo la capa de presentación en 4 componentes reutilizables, manteniendo toda la lógica de estado y efectos en la página.

## Contexto

`TestPage` es la pantalla central del flujo de test: muestra el cronómetro, la cuadrícula de navegación, el enunciado con opciones y los controles de envío. Su estado es altamente acoplado (`answers`, `index`, `elapsed`, `submitting`) por lo que se aplica el patrón de componentes presentacionales con props (mismo que Sprint 38/39), no el patrón self-contained de Sprint 37.

## Componentes creados

| Archivo | Líneas | Props | Responsabilidad |
|---|---|---|---|
| `components/test/TestTimer.jsx` | 33 | `index`, `total`, `answered`, `elapsed`, `remaining` | Header "Pregunta X/N" + cronómetro con color condicional + aviso ≤1 min + contador respondidas |
| `components/test/TestNavGrid.jsx` | 30 | `preguntas`, `answers`, `index`, `setIndex` | Cuadrícula numérica de navegación con estado visual por pregunta |
| `components/test/TestPregunta.jsx` | 31 | `question`, `answers`, `onSelect` | Enunciado + opciones de respuesta con selección visual |
| `components/test/TestControles.jsx` | 30 | `index`, `total`, `onPrev`, `onNext`, `onSubmit`, `submitting`, `answered`, `error` | Botones Anterior / Siguiente / Enviar + mensaje de error |

## Decisiones de diseño

### Lógica de display encapsulada en TestTimer
`timerColor`, `timerLabel`, `isWarning` se calculan dentro de `TestTimer` a partir de `elapsed` y `remaining`. Solo `isExpired` permanece en `TestPage` porque lo necesita el `useEffect` de auto-submit.

### Estado en TestPage
`answers`, `index`, `elapsed`, `submitting`, `error` permanecen en `TestPage`. El acoplamiento entre efectos (`answersRef`, auto-submit) y callbacks (`onSubmit`) impide separar el estado.

### formatTime movida a TestTimer
La función helper solo se usa para calcular `timerLabel`, que ahora vive en `TestTimer`. Se eliminó de `TestPage`.

## Métricas

| Fichero | Antes | Después | Reducción |
|---|---|---|---|
| `TestPage.jsx` | 187 líneas | 111 líneas | -76 líneas (-41%) |

## Verificación

- Build Vite: 107 módulos, 0 errores, 1.80s
- PR #139 mergeado en main (`89bc1cd`)

## Serie de descomposición de páginas

| Sprint | Página | Antes | Después | Componentes |
|---|---|---|---|---|
| 37 | ProgressPage | 613 | 25 | 9 (self-contained) |
| 38 | HistorialPage | 295 | 191 | 3 (presentacionales) |
| 39 | ReviewPage | 285 | 137 | 7 (presentacionales) |
| **40** | **TestPage** | **187** | **111** | **4 (presentacionales)** |

## Próximas páginas candidatas

| Página | Líneas actuales |
|---|---|
| `ProfilePage.jsx` | ~167 |
| `OposicionPage.jsx` | ~154 |
| `TemaPage.jsx` | ~154 |
