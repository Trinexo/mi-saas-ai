# Sprint 86 – Split admin.routes

## Fecha
2026-04-07

## Objetivo
Dividir `admin.routes.js` (106 líneas) en dos sub-routers Express por dominio, manteniendo compatibilidad mediante barrel.

## Archivos modificados

| Archivo | Tipo | Descripción |
|---|---|---|
| `adminCatalogo.routes.js` | Nuevo | Rutas de catálogo (oposiciones, materias, temas) |
| `adminGestion.routes.js` | Nuevo | Rutas de gestión (preguntas, reportes, auditoría, stats, usuarios) |
| `admin.routes.js` | Barrel | Monta ambos sub-routers con `router.use()` |

## División de responsabilidades

### `adminCatalogo.routes.js` — 9 rutas
- `POST /catalogo/oposiciones` — crear oposición
- `PUT /catalogo/oposiciones/:id` — actualizar oposición
- `DELETE /catalogo/oposiciones/:id` — eliminar oposición
- `POST /catalogo/materias` — crear materia
- `PUT /catalogo/materias/:id` — actualizar materia
- `DELETE /catalogo/materias/:id` — eliminar materia
- `POST /catalogo/temas` — crear tema
- `PUT /catalogo/temas/:id` — actualizar tema
- `DELETE /catalogo/temas/:id` — eliminar tema

### `adminGestion.routes.js` — 17 rutas
- Preguntas: CRUD completo + import CSV + cola sin revisar + cambio estado
- Reportes: listado + cambio estado
- Auditoría: listado (solo admin)
- Stats: global + temas con más errores + preguntas por estado
- Usuarios: listado + cambio de rol

## Barrel Express

```js
import { Router } from 'express';
import catalogoRouter from './adminCatalogo.routes.js';
import gestionRouter from './adminGestion.routes.js';

const router = Router();
router.use(catalogoRouter);
router.use(gestionRouter);

export default router;
```

El archivo que monta el router admin en la aplicación (`index.routes.js` o equivalente) no requiere ningún cambio.

## Resultado
- Build frontend: ✅ 327.31 kB sin errores
- PR código: #229 mergeado
