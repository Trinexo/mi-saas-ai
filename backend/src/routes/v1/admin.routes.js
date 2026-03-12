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
  idParamSchema,
  importPreguntasCsvSchema,
  listPreguntasQuerySchema,
  listReportesQuerySchema,
  updatePreguntaSchema,
  updateReporteEstadoSchema,
} from '../../schemas/admin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'editor', 'revisor'));
router.get('/preguntas', validate(listPreguntasQuerySchema, 'query'), listPreguntas);
router.post('/preguntas', validate(createPreguntaSchema), createPregunta);
router.get('/preguntas/:id', validate(idParamSchema, 'params'), getPregunta);
router.put('/preguntas/:id', validate(idParamSchema, 'params'), validate(updatePreguntaSchema), updatePregunta);
router.delete('/preguntas/:id', validate(idParamSchema, 'params'), deletePregunta);
router.post('/preguntas/import', validate(importPreguntasCsvSchema), importPreguntasCsv);

router.get('/reportes', validate(listReportesQuerySchema, 'query'), listReportes);
router.patch('/reportes/:id/estado', validate(idParamSchema, 'params'), validate(updateReporteEstadoSchema), updateReporteEstado);

export default router;