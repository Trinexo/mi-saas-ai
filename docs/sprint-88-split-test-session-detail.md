# Sprint 88 – Split testSessionDetail.repository

## Fecha
2026-04-07

## Objetivo
Dividir `testSessionDetail.repository.js` (89 líneas, 2 métodos) en dos sub-repositorios cohesivos por dominio, manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testSessionDetailReview.repository.js` | Nuevo | Revisión del test finalizado |
| `testSessionDetailConfig.repository.js` | Nuevo | Configuración del test activo |
| `testSessionDetail.repository.js` | Barrel | Compatibilidad — re-exporta ambos sub-repos |

## División de responsabilidades

### `testSessionDetailReview.repository.js`
- **`getTestReview(userId, testId)`** — devuelve la revisión completa de un test finalizado: cabecera con resultados (`aciertos`, `errores`, `blancos`, `nota`, `tiempoSegundos`) y listado de preguntas con las opciones, la respuesta elegida por el usuario y la respuesta correcta. Requiere que el test esté completado.

### `testSessionDetailConfig.repository.js`
- **`getTestConfig(userId, testId)`** — devuelve la configuración del test para su realización: preguntas con sus opciones (sin marcar cuál es correcta) y metadatos del test. Usado al cargar un test activo.

## Barrel de compatibilidad

```js
import { testSessionDetailReviewRepository } from './testSessionDetailReview.repository.js';
import { testSessionDetailConfigRepository } from './testSessionDetailConfig.repository.js';

export const testSessionDetailRepository = { ...testSessionDetailReviewRepository, ...testSessionDetailConfigRepository };
export { testSessionDetailReviewRepository, testSessionDetailConfigRepository };
```

El barrel `testSessionRead.repository.js` sigue importando `testSessionDetailRepository` sin cambios.

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #233 mergeado
