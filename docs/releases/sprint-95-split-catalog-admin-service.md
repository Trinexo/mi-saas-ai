# Sprint 95 – Split catalogAdmin.service

## Fecha
2026-04-08

## Objetivo
Dividir `catalogAdmin.service.js` en dos sub-servicios por dominio funcional, manteniendo compatibilidad mediante barrel y sin cambios en consumidores.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `catalogAdminOposicion.service.js` | Nuevo | Operaciones de oposición |
| `catalogAdminTaxonomia.service.js` | Nuevo | Operaciones de materia y tema |
| `catalogAdmin.service.js` | Barrel | Compatibilidad — compone ambos sub-servicios |

## División de responsabilidades

### `catalogAdminOposicion.service.js`
- `createOposicion`
- `updateOposicion`
- `deleteOposicion`

### `catalogAdminTaxonomia.service.js`
- `createMateria`
- `updateMateria`
- `deleteMateria`
- `createTema`
- `updateTema`
- `deleteTema`

## Barrel de compatibilidad

```js
import { catalogAdminOposicionService } from './catalogAdminOposicion.service.js';
import { catalogAdminTaxonomiaService } from './catalogAdminTaxonomia.service.js';

export const catalogAdminService = {
  ...catalogAdminOposicionService,
  ...catalogAdminTaxonomiaService,
};

export { catalogAdminOposicionService, catalogAdminTaxonomiaService };
```

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #246 mergeado
