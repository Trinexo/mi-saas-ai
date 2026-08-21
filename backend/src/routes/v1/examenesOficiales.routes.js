import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listExamenesOficiales, getExamenOficial, createExamenOficial,
  updateExamenOficial, deleteExamenOficial, setPreguntasExamenOficial,
  listExamenesPregunta, listAniosExamenesOficiales,
  createAnioOficial, listAniosPregunta, setAniosPregunta,
  listExamenesOposicion, listExamenesPreguntaCanonic, setExamenesPregunta,
} from '../../controllers/examenesOficiales.controller.js';
import {
  examIdParamsSchema, preguntaExamParamsSchema, examQuerySchema,
  createExamSchema, updateExamSchema, attachExamQuestionsSchema,
  oposicionYearParamsSchema, officialYearSchema, questionYearsSchema, questionExamsSchema,
} from '../../schemas/examenesOficiales.schema.js';
const router = Router();
router.get('/oposiciones/:oposicionId/anios', requireAuth, validate(oposicionYearParamsSchema, 'params'), listAniosExamenesOficiales);
router.get('/', requireAuth, validate(examQuerySchema, 'query'), listExamenesOficiales);
router.get('/oposiciones/:oposicionId/examenes', requireAuth, validate(oposicionYearParamsSchema, 'params'), validate(examQuerySchema, 'query'), listExamenesOposicion);
router.use(requireAuth, requireRole('admin', 'profesor'));
router.post('/oposiciones/:oposicionId/anios', validate(oposicionYearParamsSchema, 'params'), validate(officialYearSchema), createAnioOficial);
router.get('/preguntas/:preguntaId/anios', validate(preguntaExamParamsSchema, 'params'), listAniosPregunta);
router.put('/preguntas/:preguntaId/anios', validate(preguntaExamParamsSchema, 'params'), validate(questionYearsSchema), setAniosPregunta);
router.get('/preguntas/:preguntaId/examenes', validate(preguntaExamParamsSchema, 'params'), listExamenesPreguntaCanonic);
router.put('/preguntas/:preguntaId/examenes', validate(preguntaExamParamsSchema, 'params'), validate(questionExamsSchema), setExamenesPregunta);
router.post('/', validate(createExamSchema), createExamenOficial);
router.get('/preguntas/:preguntaId', validate(preguntaExamParamsSchema, 'params'), listExamenesPregunta);
router.get('/:id', validate(examIdParamsSchema, 'params'), getExamenOficial);
router.patch('/:id', validate(examIdParamsSchema, 'params'), validate(updateExamSchema), updateExamenOficial);
router.delete('/:id', validate(examIdParamsSchema, 'params'), deleteExamenOficial);
router.put('/:id/preguntas', validate(examIdParamsSchema, 'params'), validate(attachExamQuestionsSchema), setPreguntasExamenOficial);

export default router;
