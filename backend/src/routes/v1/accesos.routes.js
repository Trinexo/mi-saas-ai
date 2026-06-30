import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  getMisAccesos,
  checkAcceso,
  getPreparacionAcceso,
  updatePreparacionAcceso,
  listAccesos,
  asignarAcceso,
  cancelarAcceso,
  editarAcceso,
  getAccesosStats,
} from '../../controllers/accesoOposicion.controller.js';
import {
  accesoOposicionParamSchema,
  accesoUsuarioOposicionParamsSchema,
  accesosListQuerySchema,
  asignarAccesoBodySchema,
  editarAccesoBodySchema,
  preparacionAccesoBodySchema,
} from '../../schemas/accesoOposicion.schema.js';

const router = Router();

// --- Rutas de usuario autenticado ---
router.get('/mis-oposiciones', requireAuth, getMisAccesos);
router.get('/check/:oposicionId', requireAuth, validate(accesoOposicionParamSchema, 'params'), checkAcceso);
router.get('/oposicion/:oposicionId/preparacion', requireAuth, validate(accesoOposicionParamSchema, 'params'), getPreparacionAcceso);
router.patch('/oposicion/:oposicionId/preparacion', requireAuth, validate(accesoOposicionParamSchema, 'params'), validate(preparacionAccesoBodySchema, 'body'), updatePreparacionAcceso);

// --- Rutas admin ---
router.get('/', requireAuth, requireRole('admin'), validate(accesosListQuerySchema, 'query'), listAccesos);
router.get('/stats', requireAuth, requireRole('admin'), getAccesosStats);
router.post('/asignar', requireAuth, requireRole('admin'), validate(asignarAccesoBodySchema, 'body'), asignarAcceso);
router.patch('/users/:userId/:oposicionId', requireAuth, requireRole('admin'), validate(accesoUsuarioOposicionParamsSchema, 'params'), validate(editarAccesoBodySchema, 'body'), editarAcceso);
router.delete('/users/:userId/:oposicionId', requireAuth, requireRole('admin'), validate(accesoUsuarioOposicionParamsSchema, 'params'), cancelarAcceso);

export default router;
