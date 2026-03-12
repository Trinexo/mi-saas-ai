import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createPregunta,
  deletePregunta,
  getPregunta,
  importPreguntasCsv,
  listPreguntas,
  listReportes,
  updateReporteEstado,
  updatePregunta,
} from '../../controllers/admin.controller.js';
import {
  createPreguntaSchema,
  importPreguntasCsvSchema,
  updatePreguntaSchema,
  updateReporteEstadoSchema,
} from '../../schemas/admin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'editor', 'revisor'));
router.get('/preguntas', listPreguntas);
router.post('/preguntas', validate(createPreguntaSchema), createPregunta);
router.get('/preguntas/:id', getPregunta);
router.put('/preguntas/:id', validate(updatePreguntaSchema), updatePregunta);
router.delete('/preguntas/:id', deletePregunta);
router.post('/preguntas/import', validate(importPreguntasCsvSchema), importPreguntasCsv);

router.get('/reportes', listReportes);
router.patch('/reportes/:id/estado', validate(updateReporteEstadoSchema), updateReporteEstado);

export default router;