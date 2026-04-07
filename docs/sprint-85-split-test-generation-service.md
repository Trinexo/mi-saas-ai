# Sprint 85 – Split testGeneration.service

## Fecha
2026-04-07

## Objetivo
Dividir `testGeneration.service.js` (128 líneas, 2 métodos) en dos sub-servicios cohesivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testGenerationGenerate.service.js` | Nuevo | `generate` — generación principal de tests |
| `testGenerationRefuerzo.service.js` | Nuevo | `generateRefuerzo` — generación de tests de refuerzo |
| `testGeneration.service.js` | Barrel | Compatibilidad — re-exporta ambos sub-servicios |

## División de responsabilidades

### `testGenerationGenerate.service.js`
- **`generate({ userId, temaId, oposicionId, numeroPreguntas, modo, dificultad, duracionSegundos })`**
  - Soporta modos: `adaptativo`, `simulacro`, `marcadas`, `repaso`, `fresh`
  - Gestiona distribución por dificultad (`mixto` con cuotas 30/40/30)
  - Fallback con preguntas adicionales si no se alcanza el número solicitado
  - Crea el test y sus preguntas en base de datos

### `testGenerationRefuerzo.service.js`
- **`generateRefuerzo({ userId, temaId, numeroPreguntas })`**
  - Selecciona primero preguntas falladas (`pickRefuerzoQuestions`)
  - Completa con preguntas adaptativas si no hay suficientes falladas
  - Crea test de tipo `refuerzo`

## Barrel de compatibilidad

```js
import { testGenerationGenerateService } from './testGenerationGenerate.service.js';
import { testGenerationRefuerzoService } from './testGenerationRefuerzo.service.js';

export const testGenerationService = { ...testGenerationGenerateService, ...testGenerationRefuerzoService };
export { testGenerationGenerateService, testGenerationRefuerzoService };
```

El barrel `test.service.js` sigue importando `testGenerationService` sin ningún cambio.

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #227 mergeado
