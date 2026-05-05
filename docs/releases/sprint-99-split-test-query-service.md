# Sprint 99 – Split testQuery.service

## Fecha
2026-04-08

## Objetivo
Dividir `testQuery.service.js` en dos sub-servicios por dominio (histórico y detalle), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `testQueryHistory.service.js` | Nuevo | Consultas de histórico de tests |
| `testQueryDetail.service.js` | Nuevo | Consultas de detalle/configuración de test |
| `testQuery.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `testQueryHistory.service.js`
- `getHistory`

### `testQueryDetail.service.js`
- `getReview`
- `getConfig`

## Barrel de compatibilidad

```js
import { testQueryHistoryService } from './testQueryHistory.service.js';
import { testQueryDetailService } from './testQueryDetail.service.js';

export const testQueryService = {
  ...testQueryHistoryService,
  ...testQueryDetailService,
};

export { testQueryHistoryService, testQueryDetailService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #254 mergeado
