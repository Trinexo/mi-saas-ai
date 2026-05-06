import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listSimulacros,
  getSimulacro,
  createSimulacro,
  updateSimulacro,
  deleteSimulacro,
  createBloque,
  updateBloque,
  deleteBloque,
  asignarPreguntas,
  quitarPregunta,
} from '../../controllers/adminSimulacros.controller.js';
import {
  listSimulacrosQuerySchema,
  createSimulacroSchema,
  updateSimulacroSchema,
  createBloqueSchema,
  updateBloqueSchema,
  asignarPreguntasSchema,
  simulacroIdParamSchema,
  bloqueIdParamSchema,
  preguntaIdParamSchema,
} from '../../schemas/adminSimulacros.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'profesor'));

// ─── Simulacros ───────────────────────────────────────────────────────────────
// GET    /api/admin/simulacros                           → listado paginado con filtros
// GET    /api/admin/simulacros/:id                       → detalle con bloques y preguntas
// POST   /api/admin/simulacros                           → crear simulacro
// PUT    /api/admin/simulacros/:id                       → actualizar campos
// DELETE /api/admin/simulacros/:id  [solo admin]         → eliminar

router.get(
  '/',
  validate(listSimulacrosQuerySchema, 'query'),
  listSimulacros,
);
router.get(
  '/:id',
  validate(simulacroIdParamSchema, 'params'),
  getSimulacro,
);
router.post(
  '/',
  validate(createSimulacroSchema),
  createSimulacro,
);
router.put(
  '/:id',
  validate(simulacroIdParamSchema, 'params'),
  validate(updateSimulacroSchema),
  updateSimulacro,
);
router.delete(
  '/:id',
  requireRole('admin'),
  validate(simulacroIdParamSchema, 'params'),
  deleteSimulacro,
);

// ─── Bloques ─────────────────────────────────────────────────────────────────
// POST   /api/admin/simulacros/:id/bloques              → añadir bloque
// PUT    /api/admin/simulacros/:id/bloques/:bloqueId    → actualizar bloque
// DELETE /api/admin/simulacros/:id/bloques/:bloqueId    → eliminar bloque

router.post(
  '/:id/bloques',
  validate(simulacroIdParamSchema, 'params'),
  validate(createBloqueSchema),
  createBloque,
);
router.put(
  '/:id/bloques/:bloqueId',
  validate(bloqueIdParamSchema, 'params'),
  validate(updateBloqueSchema),
  updateBloque,
);
router.delete(
  '/:id/bloques/:bloqueId',
  validate(bloqueIdParamSchema, 'params'),
  deleteBloque,
);

// ─── Preguntas del bloque ────────────────────────────────────────────────────
// POST   /api/admin/simulacros/:id/bloques/:bloqueId/preguntas              → asignar preguntas
// DELETE /api/admin/simulacros/:id/bloques/:bloqueId/preguntas/:preguntaId  → quitar pregunta

router.post(
  '/:id/bloques/:bloqueId/preguntas',
  validate(bloqueIdParamSchema, 'params'),
  validate(asignarPreguntasSchema),
  asignarPreguntas,
);
router.delete(
  '/:id/bloques/:bloqueId/preguntas/:preguntaId',
  validate(preguntaIdParamSchema, 'params'),
  quitarPregunta,
);

export default router;
