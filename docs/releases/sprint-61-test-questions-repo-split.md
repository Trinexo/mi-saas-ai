# Sprint 61 – Split testQuestions.repository.js

## Resumen

Se dividió `testQuestions.repository.js` (208 líneas, 9 métodos + 9 SQL constants) en dos sub-archivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos resultantes

### `testQuestionsStandard.repository.js` (120 líneas, 6 métodos)

| Método | Descripción |
|---|---|
| `pickQuestions` | Selección estándar excluyendo recientes del usuario |
| `pickFreshQuestions` | Selección con filtro de dificultad, excluyendo recientes |
| `pickAnyQuestions` | Selección con exclusión explícita de IDs |
| `pickSimulacroQuestions` | Selección aleatoria por oposición (simulacro) |
| `pickMarcadasQuestions` | Selección de preguntas marcadas por el usuario |
| `pickRefuerzoQuestions` | Selección de preguntas más falladas (refuerzo) |

### `testQuestionsAdaptive.repository.js` (73 líneas, 3 métodos)

| Método | Descripción |
|---|---|
| `pickAdaptiveQuestions` | Selección adaptativa con scoring basado en historial |
| `pickDueQuestions` | Preguntas pendientes de repetición espaciada |
| `countDueQuestions` | Cuenta preguntas pendientes de revisión |

### `testQuestions.repository.js` (8 líneas – barrel de compatibilidad)

Re-exporta `testQuestionsStandard` y `testQuestionsAdaptive` como `testQuestionsRepository` unificado.

## Impacto

- **Barrel superior** `test.repository.js` no requiere cambios (importa `testQuestionsRepository`).
- **Build**: sin cambios en tamaño (327.31 kB).
- **CI**: 4/4 checks passed.

## PRs

- Código: #179
- Documentación: #180
