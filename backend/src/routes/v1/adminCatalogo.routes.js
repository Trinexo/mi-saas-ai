import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createOposicion,
  updateOposicion,
  deleteOposicion,
  createMateria,
  updateMateria,
  deleteMateria,
  createTema,
  updateTema,
  deleteTema,
} from '../../controllers/catalogAdmin.controller.js';
import {
  createOposicionSchema,
  updateOposicionSchema,
  createMateriaSchema,
  updateMateriaSchema,
  createTemaSchema,
  updateTemaSchema,
} from '../../schemas/catalogAdmin.schema.js';
import { idParamSchema } from '../../schemas/admin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

// --- Catálogo: oposiciones ---
router.post('/catalogo/oposiciones', validate(createOposicionSchema), createOposicion);
router.put('/catalogo/oposiciones/:id', validate(idParamSchema, 'params'), validate(updateOposicionSchema), updateOposicion);
router.delete('/catalogo/oposiciones/:id', validate(idParamSchema, 'params'), deleteOposicion);

// --- Catálogo: materias ---
router.post('/catalogo/materias', validate(createMateriaSchema), createMateria);
router.put('/catalogo/materias/:id', validate(idParamSchema, 'params'), validate(updateMateriaSchema), updateMateria);
router.delete('/catalogo/materias/:id', validate(idParamSchema, 'params'), deleteMateria);

// --- Catálogo: temas ---
router.post('/catalogo/temas', validate(createTemaSchema), createTema);
router.put('/catalogo/temas/:id', validate(idParamSchema, 'params'), validate(updateTemaSchema), updateTema);
router.delete('/catalogo/temas/:id', validate(idParamSchema, 'params'), deleteTema);

export default router;
