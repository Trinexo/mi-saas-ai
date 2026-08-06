import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  crearAccesoAdministrativo,
  modificarModelosAdministrativo,
  modificarVigenciaAdministrativo,
  listarHistorialAdministrativo,
} from '../../controllers/accesoOposicion.controller.js';
import {
  adminAccesoIdParamSchema,
  adminCrearAccesoBodySchema,
  adminModelosBodySchema,
  adminVigenciaBodySchema,
} from '../../schemas/accesoOposicion.schema.js';

const router = Router();
const adminOnly = [requireAuth, requireRole('admin')];

router.post('/', ...adminOnly, validate(adminCrearAccesoBodySchema, 'body'), crearAccesoAdministrativo);
router.patch('/:accesoId/modelos', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminModelosBodySchema, 'body'), modificarModelosAdministrativo);
router.patch('/:accesoId/vigencia', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminVigenciaBodySchema, 'body'), modificarVigenciaAdministrativo);
router.get('/:accesoId/historial', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), listarHistorialAdministrativo);

export default router;
