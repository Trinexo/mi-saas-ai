import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listOposiciones,
  createOposicion,
  updateOposicion,
  deleteOposicion,
  createTema,
  updateTema,
  deleteTema,
  createBloque,
  updateBloque,
  deleteBloque,
} from '../../controllers/catalogAdmin.controller.js';
import {
  listOposicionesQuerySchema,
  createOposicionSchema,
  updateOposicionSchema,
  createTemaSchema,
  updateTemaSchema,
  createBloqueSchema,
  updateBloqueSchema,
} from '../../schemas/catalogAdmin.schema.js';
import { idParamSchema } from '../../schemas/admin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

// --- Catálogo: oposiciones ---
// B1: listado con stats (nº preguntas, tests, usuarios)
// Request:  GET /api/admin/catalogo/oposiciones?q=&estado=&categoria=&page=&page_size=
// Response: { data: { items: [...], total: N } }
router.get('/catalogo/oposiciones', validate(listOposicionesQuerySchema, 'query'), listOposiciones);
router.post('/catalogo/oposiciones', validate(createOposicionSchema), createOposicion);
// B2: actualizar nombre, descripcion, categoria, estado, tiempo_limite_minutos
// Request:  PUT /api/admin/catalogo/oposiciones/:id  { nombre?, descripcion?, categoria?, estado?, tiempo_limite_minutos? }
// Response: { data: { id, nombre, descripcion, categoria, estado, tiempo_limite_minutos } }
router.put('/catalogo/oposiciones/:id', validate(idParamSchema, 'params'), validate(updateOposicionSchema), updateOposicion);
router.delete('/catalogo/oposiciones/:id', validate(idParamSchema, 'params'), deleteOposicion);

// --- Catálogo: temas (nivel 1, directamente bajo oposición) ---
router.post('/catalogo/temas', validate(createTemaSchema), createTema);
router.put('/catalogo/temas/:id', validate(idParamSchema, 'params'), validate(updateTemaSchema), updateTema);
router.delete('/catalogo/temas/:id', validate(idParamSchema, 'params'), deleteTema);

// --- Catálogo: bloques (nivel 2, hijos de un tema) ---
router.post('/catalogo/bloques', validate(createBloqueSchema), createBloque);
router.put('/catalogo/bloques/:id', validate(idParamSchema, 'params'), validate(updateBloqueSchema), updateBloque);
router.delete('/catalogo/bloques/:id', validate(idParamSchema, 'params'), deleteBloque);

export default router;
