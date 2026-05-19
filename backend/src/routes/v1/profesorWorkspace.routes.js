import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import {
  archivePlanificacion,
  createPlanificacion,
  getWorkspaceAlumno,
  getWorkspaceActividadFeed,
  getWorkspaceDashboard,
  getWorkspaceEstadisticas,
  getWorkspaceOposicion,
  getWorkspaceTema,
  getWorkspaceTemario,
  listPlanificacion,
  listPlanificacionResultados,
  listPreguntasProblematicas,
  listWorkspaceAlumnos,
  listWorkspaceOposiciones,
  recordarPlanificacionPendientes,
  seleccionarPreguntas,
  updatePlanificacion,
} from '../../controllers/profesorWorkspace.controller.js';
import {
  actividadFeedQuerySchema,
  createPlanificacionSchema,
  planificacionIdParamSchema,
  preguntasProblematicasQuerySchema,
  seleccionPreguntasSchema,
  slugParamSchema,
  updatePlanificacionSchema,
  workspaceAlumnosQuerySchema,
  workspaceListQuerySchema,
} from '../../schemas/profesorWorkspace.schema.js';
import { idParamSchema } from '../../schemas/admin.schema.js';

const router = Router();

router.get('/dashboard', validate(workspaceListQuerySchema, 'query'), getWorkspaceDashboard);
router.get('/oposiciones', listWorkspaceOposiciones);
router.get('/oposiciones/:slug', validate(slugParamSchema, 'params'), getWorkspaceOposicion);
router.get('/temario', validate(workspaceListQuerySchema, 'query'), getWorkspaceTemario);
router.get('/temas/:id', validate(idParamSchema, 'params'), getWorkspaceTema);
router.get('/alumnos', validate(workspaceAlumnosQuerySchema, 'query'), listWorkspaceAlumnos);
router.get('/alumnos/:id', validate(idParamSchema, 'params'), validate(workspaceListQuerySchema, 'query'), getWorkspaceAlumno);
router.get('/estadisticas', validate(workspaceListQuerySchema, 'query'), getWorkspaceEstadisticas);
router.get('/actividad', validate(actividadFeedQuerySchema, 'query'), getWorkspaceActividadFeed);
router.get('/preguntas-problematicas', validate(preguntasProblematicasQuerySchema, 'query'), listPreguntasProblematicas);

router.get('/planificacion', validate(workspaceListQuerySchema, 'query'), listPlanificacion);
router.get(
  '/planificacion/:id/resultados',
  validate(planificacionIdParamSchema, 'params'),
  validate(workspaceListQuerySchema, 'query'),
  listPlanificacionResultados,
);
router.post(
  '/planificacion/:id/recordatorio',
  validate(planificacionIdParamSchema, 'params'),
  recordarPlanificacionPendientes,
);
router.post('/planificacion', validate(createPlanificacionSchema, 'body'), createPlanificacion);
router.put(
  '/planificacion/:id',
  validate(planificacionIdParamSchema, 'params'),
  validate(updatePlanificacionSchema, 'body'),
  updatePlanificacion,
);
router.delete(
  '/planificacion/:id',
  validate(planificacionIdParamSchema, 'params'),
  archivePlanificacion,
);

router.post('/seleccion/preguntas', validate(seleccionPreguntasSchema, 'body'), seleccionarPreguntas);

export default router;
