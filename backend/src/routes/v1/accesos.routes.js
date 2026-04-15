import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import {
  getMisAccesos,
  checkAcceso,
  listAccesos,
  asignarAcceso,
  cancelarAcceso,
  editarAcceso,
  getAccesosStats,
} from '../../controllers/accesoOposicion.controller.js';

const router = Router();

// --- Rutas de usuario autenticado ---
router.get('/mis-oposiciones', requireAuth, getMisAccesos);
router.get('/check/:oposicionId', requireAuth, checkAcceso);

// --- Rutas admin ---
router.get('/', requireAuth, requireRole('admin'), listAccesos);
router.get('/stats', requireAuth, requireRole('admin'), getAccesosStats);
router.post('/asignar', requireAuth, requireRole('admin'), asignarAcceso);
router.patch('/users/:userId/:oposicionId', requireAuth, requireRole('admin'), editarAcceso);
router.delete('/users/:userId/:oposicionId', requireAuth, requireRole('admin'), cancelarAcceso);

export default router;
