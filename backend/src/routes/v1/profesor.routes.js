import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  getProfesorDashboard,
  getMisOposiciones,
  getMisPreguntas,
  listMisReportes,
  updateMiReporteEstado,
} from '../../controllers/profesor.controller.js';
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
  getMisTests,
  getMisSimulacros,
  getSimulacro,
  createSimulacro,
  updateSimulacro,
  deleteSimulacro,
  createBloque,
  updateBloque,
  deleteBloque,
  asignarPreguntas,
  quitarPregunta,
} from '../../controllers/profesorSimulacros.controller.js';
import {
  getTest as getProfesorTest,
  createTest as createProfesorTest,
  updateTest as updateProfesorTest,
  deleteTest as deleteProfesorTest,
  addPreguntas as addPreguntasProfesorTest,
  removePregunta as removePreguntaProfesorTest,
} from '../../controllers/adminTests.controller.js';
import {
  idParamSchema,
  listReportesQuerySchema,
  updateReporteEstadoSchema,
} from '../../schemas/admin.schema.js';
import {
  misTestsQuerySchema,
  misSimulacrosQuerySchema,
  createSimulacroProfesorSchema,
  updateSimulacroProfesorSchema,
  createBloqueProfesorSchema,
  updateBloqueProfesorSchema,
  asignarPreguntasProfesorSchema,
  simulacroIdParamSchema,
  bloqueIdParamSchema,
  preguntaIdProfesorParamSchema,
} from '../../schemas/profesorSimulacros.schema.js';
import { z } from 'zod';
import profesorWorkspaceRoutes from './profesorWorkspace.routes.js';

const misPreguntasQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
  oposicion_id: z.coerce.number().int().positive().optional(),
  tema_id: z.coerce.number().int().positive().optional(),
  nivel_dificultad: z.enum(['facil', 'media', 'dificil']).optional(),
  q: z.string().optional(),
});

const testPreguntaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  preguntaId: z.coerce.number().int().positive(),
});

const router = Router();

router.use(requireAuth, requireRole('profesor'));

router.use('/workspace', profesorWorkspaceRoutes);

router.get('/dashboard', getProfesorDashboard);
router.get('/mis-oposiciones', getMisOposiciones);
router.get('/mis-preguntas', validate(misPreguntasQuerySchema, 'query'), getMisPreguntas);
router.get('/reportes', validate(listReportesQuerySchema, 'query'), listMisReportes);
router.patch('/reportes/:id/estado', validate(idParamSchema, 'params'), validate(updateReporteEstadoSchema), updateMiReporteEstado);

// Banco de medios propio del workspace profesor.
// Reutiliza los controladores existentes, que ya filtran por oposiciones asignadas.
router.get('/media/preguntas', getMediaBrowser);
router.get('/media/audios', getAudioBrowser);
router.post('/preguntas/:id/imagen', validate(idParamSchema, 'params'), uploadImagenPregunta);
router.delete('/preguntas/:id/imagen', validate(idParamSchema, 'params'), deleteImagenPregunta);
router.post('/preguntas/:id/audio', validate(idParamSchema, 'params'), uploadAudioPregunta);
router.delete('/preguntas/:id/audio', validate(idParamSchema, 'params'), deleteAudioPregunta);

// ─── B7: Tests propios ────────────────────────────────────────────────────────
// GET  /api/v1/profesor/mis-tests
//   query: oposicion_id?, q?, page, page_size
//   response: { data: Test[], total, page, page_size }
router.get('/mis-tests', validate(misTestsQuerySchema, 'query'), getMisTests);
router.get('/mis-tests/:id', validate(idParamSchema, 'params'), getProfesorTest);
router.post('/mis-tests', createProfesorTest);
router.put('/mis-tests/:id', validate(idParamSchema, 'params'), updateProfesorTest);
router.delete('/mis-tests/:id', validate(idParamSchema, 'params'), deleteProfesorTest);
router.post('/mis-tests/:id/preguntas', validate(idParamSchema, 'params'), addPreguntasProfesorTest);
router.delete('/mis-tests/:id/preguntas/:preguntaId', validate(testPreguntaParamSchema, 'params'), removePreguntaProfesorTest);

// ─── B8: Simulacros propios ────────────────────────────────────────────────────
// GET  /api/v1/profesor/mis-simulacros
//   query: oposicion_id?, estado?, q?, page, page_size
//   response: { data: Simulacro[], total, page, page_size }
router.get('/mis-simulacros', validate(misSimulacrosQuerySchema, 'query'), getMisSimulacros);

// GET  /api/v1/profesor/mis-simulacros/:id
router.get(
  '/mis-simulacros/:id',
  validate(simulacroIdParamSchema, 'params'),
  getSimulacro
);

// POST /api/v1/profesor/mis-simulacros
//   body: { titulo, descripcion?, oposicion_id?, tiempo_limite_segundos?, puntuacion_maxima?, penalizacion?, mostrar_resultados_al_final?, fecha_publicacion? }
router.post(
  '/mis-simulacros',
  validate(createSimulacroProfesorSchema, 'body'),
  createSimulacro
);

// PUT  /api/v1/profesor/mis-simulacros/:id
router.put(
  '/mis-simulacros/:id',
  validate(simulacroIdParamSchema, 'params'),
  validate(updateSimulacroProfesorSchema, 'body'),
  updateSimulacro
);

// DELETE /api/v1/profesor/mis-simulacros/:id
router.delete(
  '/mis-simulacros/:id',
  validate(simulacroIdParamSchema, 'params'),
  deleteSimulacro
);

// POST /api/v1/profesor/mis-simulacros/:id/bloques
router.post(
  '/mis-simulacros/:id/bloques',
  validate(simulacroIdParamSchema, 'params'),
  validate(createBloqueProfesorSchema, 'body'),
  createBloque
);

// PUT  /api/v1/profesor/mis-simulacros/:id/bloques/:bloqueId
router.put(
  '/mis-simulacros/:id/bloques/:bloqueId',
  validate(bloqueIdParamSchema, 'params'),
  validate(updateBloqueProfesorSchema, 'body'),
  updateBloque
);

// DELETE /api/v1/profesor/mis-simulacros/:id/bloques/:bloqueId
router.delete(
  '/mis-simulacros/:id/bloques/:bloqueId',
  validate(bloqueIdParamSchema, 'params'),
  deleteBloque
);

// POST   /api/v1/profesor/mis-simulacros/:id/bloques/:bloqueId/preguntas
router.post(
  '/mis-simulacros/:id/bloques/:bloqueId/preguntas',
  validate(bloqueIdParamSchema, 'params'),
  validate(asignarPreguntasProfesorSchema, 'body'),
  asignarPreguntas
);

// DELETE /api/v1/profesor/mis-simulacros/:id/bloques/:bloqueId/preguntas/:preguntaId
router.delete(
  '/mis-simulacros/:id/bloques/:bloqueId/preguntas/:preguntaId',
  validate(preguntaIdProfesorParamSchema, 'params'),
  quitarPregunta
);

export default router;
