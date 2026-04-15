import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createPregunta,
  deletePregunta,
  getAdminStats,
  getTemasConMasErrores,
  getPregunta,
  importPreguntasCsv,
  listAuditoria,
  listPreguntas,
  listReportes,
  listUsers,
  updateReporteEstado,
  updatePregunta,
  updateUserRole,
  deleteUser,
  bulkUsers,
  listProfesorAsignaciones,
  assignProfesorOposicion,
  removeProfesorOposicion,
  listProfesores,
  createProfesor,
  updateProfesor,
  deleteProfesor,
} from '../../controllers/admin.controller.js';
import {
  createPreguntaSchema,
  idParamSchema,
  importPreguntasCsvSchema,
  listAuditoriaQuerySchema,
  listPreguntasQuerySchema,
  listReportesQuerySchema,
  listUsersQuerySchema,
  updatePreguntaSchema,
  updateReporteEstadoSchema,
  updateUserRoleSchema,
  bulkUsersSchema,
  profesorAsignacionesQuerySchema,
  profesorOposicionPayloadSchema,
  listProfesoresQuerySchema,
  createProfesorSchema,
  updateProfesorSchema,
} from '../../schemas/admin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'profesor'));

// --- Preguntas ---
router.get('/preguntas', validate(listPreguntasQuerySchema, 'query'), listPreguntas);
router.post('/preguntas', validate(createPreguntaSchema), createPregunta);
router.post('/preguntas/import', requireRole('admin'), validate(importPreguntasCsvSchema), importPreguntasCsv);
router.get('/preguntas/:id', requireRole('admin'), validate(idParamSchema, 'params'), getPregunta);
router.put('/preguntas/:id', requireRole('admin'), validate(idParamSchema, 'params'), validate(updatePreguntaSchema), updatePregunta);
router.delete('/preguntas/:id', requireRole('admin'), validate(idParamSchema, 'params'), deletePregunta);

// --- Reportes ---
router.get('/reportes', requireRole('admin'), validate(listReportesQuerySchema, 'query'), listReportes);
router.patch('/reportes/:id/estado', requireRole('admin'), validate(idParamSchema, 'params'), validate(updateReporteEstadoSchema), updateReporteEstado);

// --- Auditoría ---
router.get('/auditoria', requireRole('admin'), validate(listAuditoriaQuerySchema, 'query'), listAuditoria);

// --- Stats globales ---
router.get('/stats', requireRole('admin'), getAdminStats);

// --- Usuarios ---router.get('/users', requireRole('admin'), validate(listUsersQuerySchema, 'query'), listUsers);
router.patch('/users/:id/role', requireRole('admin'), validate(idParamSchema, 'params'), validate(updateUserRoleSchema), updateUserRole);
router.delete('/users/:id', requireRole('admin'), validate(idParamSchema, 'params'), deleteUser);
router.post('/users/bulk', requireRole('admin'), validate(bulkUsersSchema), bulkUsers);

// --- Stats: temas con más errores ---
router.get('/stats/temas-errores', requireRole('admin'), getTemasConMasErrores);

// --- Profesor: gestión de asignaciones de oposiciones ---
router.get('/profesores/asignaciones', requireRole('admin'), validate(profesorAsignacionesQuerySchema, 'query'), listProfesorAsignaciones);
router.post('/profesores/asignaciones', requireRole('admin'), validate(profesorOposicionPayloadSchema), assignProfesorOposicion);
router.delete('/profesores/asignaciones', requireRole('admin'), validate(profesorOposicionPayloadSchema), removeProfesorOposicion);

// --- Profesor: CRUD ---
router.get('/profesores', requireRole('admin'), validate(listProfesoresQuerySchema, 'query'), listProfesores);
router.post('/profesores', requireRole('admin'), validate(createProfesorSchema), createProfesor);
router.patch('/profesores/:id', requireRole('admin'), validate(idParamSchema, 'params'), validate(updateProfesorSchema), updateProfesor);
router.delete('/profesores/:id', requireRole('admin'), validate(idParamSchema, 'params'), deleteProfesor);

export default router;
