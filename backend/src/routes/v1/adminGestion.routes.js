import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createPregunta,
  deletePregunta,
  getAdminStats,
  getTemasConMasErrores,
  getPregunta,
  getPreguntasPorEstado,
  importPreguntasCsv,
  listAuditoria,
  listPreguntas,
  listPreguntasSinRevisar,
  listReportes,
  listUsers,
  updatePreguntaEstado,
  updateReporteEstado,
  updatePregunta,
  updateUserRole,
} from '../../controllers/admin.controller.js';
import {
  createPreguntaSchema,
  idParamSchema,
  importPreguntasCsvSchema,
  listAuditoriaQuerySchema,
  listPreguntasQuerySchema,
  listReportesQuerySchema,
  listSinRevisarQuerySchema,
  listUsersQuerySchema,
  updatePreguntaEstadoSchema,
  updatePreguntaSchema,
  updateReporteEstadoSchema,
  updateUserRoleSchema,
} from '../../schemas/admin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'editor', 'revisor'));

// --- Preguntas ---
router.get('/preguntas', validate(listPreguntasQuerySchema, 'query'), listPreguntas);
router.post('/preguntas', validate(createPreguntaSchema), createPregunta);
router.post('/preguntas/import', validate(importPreguntasCsvSchema), importPreguntasCsv);
// --- Cola de revisión (antes de :id para evitar conflictos) ---
router.get('/preguntas/sin-revisar', requireRole('admin', 'revisor'), validate(listSinRevisarQuerySchema, 'query'), listPreguntasSinRevisar);
router.get('/preguntas/:id', validate(idParamSchema, 'params'), getPregunta);
router.put('/preguntas/:id', validate(idParamSchema, 'params'), validate(updatePreguntaSchema), updatePregunta);
router.delete('/preguntas/:id', validate(idParamSchema, 'params'), deletePregunta);
router.patch('/preguntas/:id/estado', requireRole('admin', 'revisor'), validate(idParamSchema, 'params'), validate(updatePreguntaEstadoSchema), updatePreguntaEstado);

// --- Reportes ---
router.get('/reportes', validate(listReportesQuerySchema, 'query'), listReportes);
router.patch('/reportes/:id/estado', validate(idParamSchema, 'params'), validate(updateReporteEstadoSchema), updateReporteEstado);

// --- Auditoría ---
router.get('/auditoria', requireRole('admin'), validate(listAuditoriaQuerySchema, 'query'), listAuditoria);

// --- Stats globales ---
router.get('/stats', requireRole('admin'), getAdminStats);

// --- Usuarios ---
router.get('/users', requireRole('admin'), validate(listUsersQuerySchema, 'query'), listUsers);
router.patch('/users/:id/role', requireRole('admin'), validate(idParamSchema, 'params'), validate(updateUserRoleSchema), updateUserRole);

// --- Stats: temas con más errores ---
router.get('/stats/temas-errores', requireRole('admin'), getTemasConMasErrores);

// --- Stats: preguntas por estado ---
router.get('/stats/preguntas-por-estado', requireRole('admin'), getPreguntasPorEstado);

export default router;
