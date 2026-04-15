# Sprint 100 – Split adminPreguntasCrudRead.service

## Fecha
2026-04-08

## Objetivo
Dividir `adminPreguntasCrudRead.service.js` en dos sub-servicios por dominio (listados y detalle/estado), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPreguntasCrudReadList.service.js` | Nuevo | Listados de preguntas y pendientes de revisión |
| `adminPreguntasCrudReadDetail.service.js` | Nuevo | Detalle de pregunta y métricas por estado |
| `adminPreguntasCrudRead.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `adminPreguntasCrudReadList.service.js`
- `listPreguntas`
- `listPreguntasSinRevisar`

### `adminPreguntasCrudReadDetail.service.js`
- `getPregunta`
- `getPreguntasPorEstado`

## Barrel de compatibilidad

```js
import { adminPreguntasCrudReadListService } from './adminPreguntasCrudReadList.service.js';
import { adminPreguntasCrudReadDetailService } from './adminPreguntasCrudReadDetail.service.js';

export const adminPreguntasCrudReadService = {
  ...adminPreguntasCrudReadListService,
  ...adminPreguntasCrudReadDetailService,
};

export { adminPreguntasCrudReadListService, adminPreguntasCrudReadDetailService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
