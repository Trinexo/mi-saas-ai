# Release Notes — Sprint 67: testQuestionsStandard.repository.js split

## Descripción

División de `testQuestionsStandard.repository.js` (132 líneas, 6 métodos) en dos repositorios separados por modo de test.

## Archivos modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `backend/src/repositories/testQuestionsStandard.repository.js` | Barrel | 132 → 6 líneas |
| `backend/src/repositories/testQuestionsTheme.repository.js` | Nuevo | 3 métodos de selección por tema |
| `backend/src/repositories/testQuestionsSpecial.repository.js` | Nuevo | 3 métodos de modos especiales |

## Criterio de división

| Sub-repositorio | Modo | Métodos |
|---|---|---|
| `testQuestionsThemeRepository` | Selección por tema (con exclusión de vistas recientes) | `pickQuestions`, `pickFreshQuestions`, `pickAnyQuestions` |
| `testQuestionsSpecialRepository` | Modos especiales de test | `pickSimulacroQuestions`, `pickMarcadasQuestions`, `pickRefuerzoQuestions` |

### `testQuestionsTheme.repository.js`
- Consultas con exclusión de las últimas 200 preguntas vistas por el usuario
- Soporte para filtro por `nivelDificultad` y exclusión de IDs específicos

### `testQuestionsSpecial.repository.js`
- `pickSimulacroQuestions`: selección aleatoria por oposición completa
- `pickMarcadasQuestions`: preguntas marcadas por el usuario
- `pickRefuerzoQuestions`: preguntas falladas más frecuentemente (CTE `WITH failed`)

## Barrel de compatibilidad

```js
// testQuestionsStandard.repository.js
import { testQuestionsThemeRepository } from './testQuestionsTheme.repository.js';
import { testQuestionsSpecialRepository } from './testQuestionsSpecial.repository.js';

export const testQuestionsStandardRepository = { ...testQuestionsThemeRepository, ...testQuestionsSpecialRepository };
export { testQuestionsThemeRepository, testQuestionsSpecialRepository };
```

El barrel `testQuestions.repository.js` no requiere cambios.

## Verificación

- Build frontend: **327.31 kB** ✅
- CI: build-frontend ✅, test-backend ✅
- PR #191 mergeado en main
