import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  getProfesorDashboard,
  getMisOposiciones,
  getMisPreguntas,
} from '../../controllers/profesor.controller.js';
import { z } from 'zod';

const misPreguntasQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
  oposicion_id: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
});

const router = Router();

router.use(requireAuth, requireRole('profesor'));

router.get('/dashboard', getProfesorDashboard);
router.get('/mis-oposiciones', getMisOposiciones);
router.get('/mis-preguntas', validate(misPreguntasQuerySchema, 'query'), getMisPreguntas);

export default router;
