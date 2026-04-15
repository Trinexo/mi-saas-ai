# Sprint 105 – Split catalog.service

## Fecha
2026-04-08

## Objetivo
Dividir `catalog.service.js` en sub-servicios por dominio (jerarquía de catálogo y listado de preguntas), manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `catalogHierarchy.service.js` | Nuevo | Consultas de oposiciones, materias y temas |
| `catalogPreguntas.service.js` | Nuevo | Consulta paginada de preguntas por tema |
| `catalog.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `catalogHierarchy.service.js`
- `getOposiciones`
- `getMaterias`
- `getTemas`

### `catalogPreguntas.service.js`
- `getPreguntas`

## Barrel de compatibilidad

```js
import { catalogHierarchyService } from './catalogHierarchy.service.js';
import { catalogPreguntasService } from './catalogPreguntas.service.js';

export const catalogService = {
  ...catalogHierarchyService,
  ...catalogPreguntasService,
};

export { catalogHierarchyService, catalogPreguntasService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
