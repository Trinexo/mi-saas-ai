# Sprint 101 – Split adminPreguntasCrudWrite.service

## Fecha
2026-04-08

## Objetivo
Dividir `adminPreguntasCrudWrite.service.js` en dos sub-servicios por dominio (mutaciones CRUD y cambio de estado), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminPreguntasCrudWriteMutation.service.js` | Nuevo | Operaciones create/update/delete con transacción y auditoría |
| `adminPreguntasCrudWriteEstado.service.js` | Nuevo | Cambio de estado con validación de rol |
| `adminPreguntasCrudWrite.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `adminPreguntasCrudWriteMutation.service.js`
- `createPregunta`
- `updatePregunta`
- `deletePregunta`

### `adminPreguntasCrudWriteEstado.service.js`
- `updatePreguntaEstado`

## Barrel de compatibilidad

```js
import { adminPreguntasCrudWriteMutationService } from './adminPreguntasCrudWriteMutation.service.js';
import { adminPreguntasCrudWriteEstadoService } from './adminPreguntasCrudWriteEstado.service.js';

export const adminPreguntasCrudWriteService = {
  ...adminPreguntasCrudWriteMutationService,
  ...adminPreguntasCrudWriteEstadoService,
};

export { adminPreguntasCrudWriteMutationService, adminPreguntasCrudWriteEstadoService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
