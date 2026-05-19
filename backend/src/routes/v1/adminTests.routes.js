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
  seleccionarPreguntasAdmin,
} from '../../controllers/adminTests.controller.js';
import { seleccionPreguntasSchema } from '../../schemas/profesorWorkspace.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'profesor'));

// GET    /api/admin/tests                         → listado paginado
// GET    /api/admin/tests/:id                     → detalle con preguntas
// POST   /api/admin/tests                         → crear test
// PUT    /api/admin/tests/:id                     → actualizar campos
// DELETE /api/admin/tests/:id   [solo admin]      → eliminar

router.get('/',     listTests);
router.get('/:id',  getTest);
router.post('/',    createTest);
router.put('/:id',  updateTest);
router.delete('/:id', requireRole('admin'), deleteTest);

// Gestión de preguntas
// POST   /api/admin/tests/:id/preguntas           → añadir preguntas (array)
// DELETE /api/admin/tests/:id/preguntas/:preguntaId → quitar pregunta

router.post('/:id/preguntas',                       addPreguntas);
router.delete('/:id/preguntas/:preguntaId',          removePregunta);

// Selección automática de preguntas (solo admin)
// POST /api/admin/tests/seleccion/preguntas
router.post('/seleccion/preguntas', requireRole('admin'), validate(seleccionPreguntasSchema, 'body'), seleccionarPreguntasAdmin);

export default router;
