import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  crearAccesoAdministrativo,
  modificarModelosAdministrativo,
  modificarVigenciaAdministrativo,
  listarHistorialAdministrativo,
  renovarAccesoAdministrativo,
  revocarAccesoAdministrativo,
  cancelarAccesoAdministrativo,
  reactivarAccesoAdministrativo,
} from '../../controllers/accesoOposicion.controller.js';
import {
  adminAccesoIdParamSchema,
  adminCrearAccesoBodySchema,
  adminModelosBodySchema,
  adminVigenciaBodySchema,
  adminMotivoBodySchema,
  adminRenovarBodySchema,
  adminReactivarBodySchema,
} from '../../schemas/accesoOposicion.schema.js';

const router = Router();
const adminOnly = [requireAuth, requireRole('admin')];

router.post('/', ...adminOnly, validate(adminCrearAccesoBodySchema, 'body'), crearAccesoAdministrativo);
router.patch('/:accesoId/modelos', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminModelosBodySchema, 'body'), modificarModelosAdministrativo);
router.patch('/:accesoId/vigencia', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminVigenciaBodySchema, 'body'), modificarVigenciaAdministrativo);
router.get('/:accesoId/historial', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), listarHistorialAdministrativo);
router.post('/:accesoId/renovar', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminRenovarBodySchema, 'body'), renovarAccesoAdministrativo);
router.post('/:accesoId/revocar', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminMotivoBodySchema, 'body'), revocarAccesoAdministrativo);
router.post('/:accesoId/cancelar', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminMotivoBodySchema, 'body'), cancelarAccesoAdministrativo);
router.post('/:accesoId/reactivar', ...adminOnly, validate(adminAccesoIdParamSchema, 'params'), validate(adminReactivarBodySchema, 'body'), reactivarAccesoAdministrativo);

export default router;
