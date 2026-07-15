# Sprint 51 — Split test.repository.js en testQuestions y testSession

## Resumen

Refactorización del repositorio de tests backend: `test.repository.js` (439 líneas) dividido en dos archivos especializados por dominio. El archivo original queda como barrel de compatibilidad (10 líneas).

## Motivación

`test.repository.js` mezclaba dos responsabilidades distintas en 439 líneas:
- Selección y picking de preguntas para los distintos modos de test
- Ciclo de vida de la sesión de test (crear, enviar respuestas, guardar resultado, revisar, historial)

## Cambios

### Archivos creados

#### `backend/src/repositories/testQuestions.repository.js`
- **Propósito**: Queries de selección de preguntas para todos los modos de test
- **Líneas**: ~195
- **SQL constants** (9): `SELECT_QUESTIONS_SQL`, `SELECT_FRESH_QUESTIONS_SQL`, `SELECT_ANY_QUESTIONS_SQL`, `SELECT_DUE_QUESTIONS_SQL`, `COUNT_DUE_QUESTIONS_SQL`, `SELECT_ADAPTIVE_QUESTIONS_SQL`, `SELECT_SIMULACRO_QUESTIONS_SQL`, `SELECT_MARCADAS_QUESTIONS_SQL`, `SELECT_REFUERZO_QUESTIONS_SQL`
- **Métodos** (9):
  - `pickQuestions` — selección básica excluyendo vistas recientemente
  - `pickFreshQuestions` — selección fresca con filtro por nivel
  - `pickAnyQuestions` — selección genérica excluyendo IDs específicos
  - `pickAdaptiveQuestions` — selección adaptativa por score de dificultad personal
  - `pickSimulacroQuestions` — selección aleatoria por oposición
  - `pickMarcadasQuestions` — preguntas marcadas por el usuario
  - `pickRefuerzoQuestions` — preguntas más falladas por el usuario
  - `pickDueQuestions` — preguntas pendientes de repetición espaciada
  - `countDueQuestions` — total de preguntas pendientes de revisión

#### `backend/src/repositories/testSession.repository.js`
- **Propósito**: Queries de gestión del ciclo de vida de una sesión de test
- **Líneas**: ~195
- **Métodos** (12):
  - `getUserHistory` — historial de tests finalizados con paginación y filtros
  - `getTestReview` — revisión detallada de un test con respuestas de usuario
  - `getTestConfig` — configuración y preguntas de un test en curso
  - `createTest` — inserción del registro de test
  - `insertTestPreguntas` — asociación de preguntas al test
  - `getContextoNombres` — nombres de tema y oposición para contexto
  - `getTestById` — lookup en transacción
  - `getCorrectAnswersByTest` — mapa de respuestas correctas en transacción
  - `insertRespuesta` — registro de respuesta de usuario en transacción
  - `insertResultado` — registro de resultado en transacción
  - `markTestAsDone` — marcar test como finalizado en transacción
  - `updateProgress` — actualizar progreso del usuario en transacción

### Archivos modificados

#### `backend/src/repositories/test.repository.js` → barrel (10 líneas)
Fusiona ambos repositorios en `testRepository` para compatibilidad total:

```js
// Barrel de compatibilidad
import { testQuestionsRepository } from './testQuestions.repository.js';
import { testSessionRepository } from './testSession.repository.js';

export const testRepository = {
  ...testQuestionsRepository,
  ...testSessionRepository,
};

export { testQuestionsRepository, testSessionRepository };
```

#### `backend/src/services/test.service.js` — sin cambios
#### 13 archivos de tests — sin cambios

## Métricas

| Archivo | Antes | Después |
|---|---|---|
| `test.repository.js` | 439 líneas | 10 líneas (barrel) |
| `testQuestions.repository.js` | — | ~195 líneas |
| `testSession.repository.js` | — | ~195 líneas |

## Compatibilidad

- **`test.service.js`**: Sin cambios. Sigue usando `testRepository` del barrel.
- **13 tests** que importan `testRepository` y mutan sus métodos: Sin cambios. El patrón de mutación funciona sobre el objeto fusionado.
- **Nuevos consumidores**: Pueden importar `testQuestionsRepository` o `testSessionRepository` por separado.

## CI

- `build-frontend`: ✅ pass
- `test-backend`: ✅ pass (4/4 checks)

## PR

- Código: #159 — `refactor(backend): dividir test.repository.js en testQuestions y testSession`
- Docs: #160 (este PR)
