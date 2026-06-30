import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  addPreguntas,
  removePregunta,
  setDemoTest,
  seleccionarPreguntasAdmin,
} from '../../controllers/adminTests.controller.js';
import { seleccionPreguntasSchema } from '../../schemas/profesorWorkspace.schema.js';
import {
  addPreguntasTestSchema,
  createTestSchema,
  listTestsQuerySchema,
  setDemoTestSchema,
  testIdParamSchema,
  testPreguntaParamSchema,
  updateTestSchema,
} from '../../schemas/adminTests.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'profesor'));

// GET    /api/admin/tests                         → listado paginado
// GET    /api/admin/tests/:id                     → detalle con preguntas
// POST   /api/admin/tests                         → crear test
// PUT    /api/admin/tests/:id                     → actualizar campos
// DELETE /api/admin/tests/:id   [solo admin]      → eliminar

router.get('/', validate(listTestsQuerySchema, 'query'), listTests);
router.get('/:id', validate(testIdParamSchema, 'params'), getTest);
router.post('/', validate(createTestSchema), createTest);
router.put('/:id', validate(testIdParamSchema, 'params'), validate(updateTestSchema), updateTest);
router.delete('/:id', requireRole('admin'), validate(testIdParamSchema, 'params'), deleteTest);

// Gestión de preguntas
// POST   /api/admin/tests/:id/preguntas           → añadir preguntas (array)
// DELETE /api/admin/tests/:id/preguntas/:preguntaId → quitar pregunta

router.post('/:id/preguntas', validate(testIdParamSchema, 'params'), validate(addPreguntasTestSchema), addPreguntas);
router.delete('/:id/preguntas/:preguntaId', validate(testPreguntaParamSchema, 'params'), removePregunta);
router.patch('/:id/demo', validate(testIdParamSchema, 'params'), validate(setDemoTestSchema), setDemoTest);

// Selección automática de preguntas (solo admin)
// POST /api/admin/tests/seleccion/preguntas
router.post('/seleccion/preguntas', requireRole('admin'), validate(seleccionPreguntasSchema, 'body'), seleccionarPreguntasAdmin);

export default router;
