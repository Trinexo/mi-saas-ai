import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  uploadImagenPregunta,
  deleteImagenPregunta,
  getMediaBrowser,
} from '../../controllers/adminImagenPregunta.controller.js';
import {
  uploadAudioPregunta,
  deleteAudioPregunta,
  getAudioBrowser,
} from '../../controllers/adminAudioPregunta.controller.js';
import {
  createPregunta,
  deletePregunta,
  getAdminStats,
  getBloquesConMasErrores,
  getPregunta,
  importPreguntasCsv,
  listAuditoria,
  listPreguntas,
  listReportes,
  listUsers,
  createUser,
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
  getAdminStatsFull,
  getDistribucionContenido,
  getTopOposiciones,
  getEvolucionUsuarios,
  getActividadReciente,
} from '../../controllers/adminPanel.controller.js';
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
  createUserAdminSchema,
  profesorAsignacionesQuerySchema,
  profesorOposicionPayloadSchema,
  listProfesoresQuerySchema,
  createProfesorSchema,
  actividadRecienteQuerySchema,
  bloquesErroresQuerySchema,
  evolucionUsuariosQuerySchema,
  updateProfesorSchema,
  topOposicionesQuerySchema,
} from '../../schemas/admin.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'profesor'));

// --- Preguntas ---
router.get('/preguntas', validate(listPreguntasQuerySchema, 'query'), listPreguntas);
router.post('/preguntas', validate(createPreguntaSchema), createPregunta);
router.post('/preguntas/import', validate(importPreguntasCsvSchema), importPreguntasCsv);
router.get('/preguntas/:id', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), getPregunta);
router.put('/preguntas/:id', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), validate(updatePreguntaSchema), updatePregunta);
router.delete('/preguntas/:id', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), deletePregunta);
router.post('/preguntas/:id/imagen', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), uploadImagenPregunta);
router.delete('/preguntas/:id/imagen', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), deleteImagenPregunta);
router.post('/preguntas/:id/audio', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), uploadAudioPregunta);
router.delete('/preguntas/:id/audio', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), deleteAudioPregunta);

// --- Banco de medios ---
router.get('/media/preguntas', requireRole('admin', 'profesor'), getMediaBrowser);
router.get('/media/audios', requireRole('admin', 'profesor'), getAudioBrowser);

// --- Reportes ---
router.get('/reportes', requireRole('admin', 'profesor'), validate(listReportesQuerySchema, 'query'), listReportes);
router.patch('/reportes/:id/estado', requireRole('admin', 'profesor'), validate(idParamSchema, 'params'), validate(updateReporteEstadoSchema), updateReporteEstado);

// --- Auditoría ---
router.get('/auditoria', requireRole('admin'), validate(listAuditoriaQuerySchema, 'query'), listAuditoria);

// --- Stats globales (legado) ---
router.get('/stats', requireRole('admin'), getAdminStats);

// --- B6: Stats ampliados para Dashboard ---
// GET /api/admin/stats/full          → KPIs: usuarios activos 30d, simulacros publicados, oposiciones activas…
// GET /api/admin/stats/contenido     → distribución circular: preguntas/tests/simulacros/temas
// GET /api/admin/stats/top-oposiciones?limit=5  → top oposiciones por actividad 30d
// GET /api/admin/stats/evolucion-usuarios?dias=30 → evolución de registros por día
router.get('/stats/full',              requireRole('admin'), getAdminStatsFull);
router.get('/stats/contenido',         requireRole('admin'), getDistribucionContenido);
router.get('/stats/top-oposiciones',   requireRole('admin'), validate(topOposicionesQuerySchema, 'query'), getTopOposiciones);
router.get('/stats/evolucion-usuarios',requireRole('admin'), validate(evolucionUsuariosQuerySchema, 'query'), getEvolucionUsuarios);

// --- B5: Actividad reciente ---
// GET /api/admin/actividad?limit=20  → últimos N eventos del log actividad_global
router.get('/actividad', requireRole('admin'), validate(actividadRecienteQuerySchema, 'query'), getActividadReciente);

// --- Usuarios ---
router.get('/users', requireRole('admin'), validate(listUsersQuerySchema, 'query'), listUsers);
router.post('/users', requireRole('admin'), validate(createUserAdminSchema), createUser);
router.patch('/users/:id/role', requireRole('admin'), validate(idParamSchema, 'params'), validate(updateUserRoleSchema), updateUserRole);
router.delete('/users/:id', requireRole('admin'), validate(idParamSchema, 'params'), deleteUser);
router.post('/users/bulk', requireRole('admin'), validate(bulkUsersSchema), bulkUsers);

// --- Stats: temas con más errores ---
router.get('/stats/bloques-errores', requireRole('admin'), validate(bloquesErroresQuerySchema, 'query'), getBloquesConMasErrores);

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
