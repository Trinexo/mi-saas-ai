import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createPregunta,
  deletePregunta,
  getPregunta,
  importPreguntasCsv,
  listAuditoria,
  listPreguntas,
  listReportes,
  updateReporteEstado,
  updatePregunta,
} from '../../controllers/admin.controller.js';
import {
  createOposicion,
  updateOposicion,
  deleteOposicion,
  createMateria,
  updateMateria,
  deleteMateria,
  createTema,
  updateTema,
  deleteTema,
} from '../../controllers/catalogAdmin.controller.js';
import {
  createPreguntaSchema,
  idParamSchema,
  importPreguntasCsvSchema,
  listAuditoriaQuerySchema,
  listPreguntasQuerySchema,
  listReportesQuerySchema,
  updatePreguntaSchema,
  updateReporteEstadoSchema,
} from '../../schemas/admin.schema.js';
import {
  createOposicionSchema,
  updateOposicionSchema,
  createMateriaSchema,
  updateMateriaSchema,
  createTemaSchema,
  updateTemaSchema,
} from '../../schemas/catalogAdmin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'editor', 'revisor'));

// --- Catálogo: oposiciones ---
router.post('/catalogo/oposiciones', requireRole('admin', 'editor'), validate(createOposicionSchema), createOposicion);
router.put('/catalogo/oposiciones/:id', requireRole('admin', 'editor'), validate(idParamSchema, 'params'), validate(updateOposicionSchema), updateOposicion);
router.delete('/catalogo/oposiciones/:id', requireRole('admin'), validate(idParamSchema, 'params'), deleteOposicion);

// --- Catálogo: materias ---
router.post('/catalogo/materias', requireRole('admin', 'editor'), validate(createMateriaSchema), createMateria);
router.put('/catalogo/materias/:id', requireRole('admin', 'editor'), validate(idParamSchema, 'params'), validate(updateMateriaSchema), updateMateria);
router.delete('/catalogo/materias/:id', requireRole('admin'), validate(idParamSchema, 'params'), deleteMateria);

// --- Catálogo: temas ---
router.post('/catalogo/temas', requireRole('admin', 'editor'), validate(createTemaSchema), createTema);
router.put('/catalogo/temas/:id', requireRole('admin', 'editor'), validate(idParamSchema, 'params'), validate(updateTemaSchema), updateTema);
router.delete('/catalogo/temas/:id', requireRole('admin'), validate(idParamSchema, 'params'), deleteTema);

// --- Preguntas ---
router.get('/preguntas', validate(listPreguntasQuerySchema, 'query'), listPreguntas);
router.post('/preguntas', validate(createPreguntaSchema), createPregunta);
router.get('/preguntas/:id', validate(idParamSchema, 'params'), getPregunta);
router.put('/preguntas/:id', validate(idParamSchema, 'params'), validate(updatePreguntaSchema), updatePregunta);
router.delete('/preguntas/:id', validate(idParamSchema, 'params'), deletePregunta);
router.post('/preguntas/import', validate(importPreguntasCsvSchema), importPreguntasCsv);

// --- Reportes ---
router.get('/reportes', validate(listReportesQuerySchema, 'query'), listReportes);
router.patch('/reportes/:id/estado', validate(idParamSchema, 'params'), validate(updateReporteEstadoSchema), updateReporteEstado);

// --- Auditoría ---
router.get('/auditoria', requireRole('admin'), validate(listAuditoriaQuerySchema, 'query'), listAuditoria);

export default router;