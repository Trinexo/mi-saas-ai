import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  empezarAlbacerItem,
  empezarAlbacerSimulacroFinal,
  getAlbacerEstado,
  listAlbacerAlumnoModulos,
} from '../../controllers/albacerAlumno.controller.js';
import {
  albacerAlumnoEstadoQuerySchema,
  albacerAlumnoItemParamSchema,
  albacerAlumnoModuloParamSchema,
} from '../../schemas/albacerAlumno.schema.js';

const router = Router();

router.get('/estado', requireAuth, validate(albacerAlumnoEstadoQuerySchema, 'query'), getAlbacerEstado);
router.get('/modulos', requireAuth, validate(albacerAlumnoEstadoQuerySchema, 'query'), listAlbacerAlumnoModulos);
router.post('/items/:itemId/empezar', requireAuth, validate(albacerAlumnoItemParamSchema, 'params'), empezarAlbacerItem);
router.post('/modulos/:id/simulacro-final/empezar', requireAuth, validate(albacerAlumnoModuloParamSchema, 'params'), empezarAlbacerSimulacroFinal);

export default router;
