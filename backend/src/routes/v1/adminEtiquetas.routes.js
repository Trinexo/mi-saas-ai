import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listEtiquetas,
  getEtiqueta,
  createEtiqueta,
  updateEtiqueta,
  deleteEtiqueta,
  getEtiquetasDePregunta,
  setEtiquetasDePregunta,
} from '../../controllers/adminEtiquetas.controller.js';
import {
  listEtiquetasQuerySchema,
  createEtiquetaSchema,
  updateEtiquetaSchema,
  setEtiquetasDePreguntaSchema,
  etiquetaIdParamSchema,
  preguntaEtiquetasParamSchema,
} from '../../schemas/adminEtiquetas.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'profesor'));

// ─── Catálogo de etiquetas ────────────────────────────────────────────────────
// GET    /api/admin/etiquetas                → listado paginado con total_preguntas
// GET    /api/admin/etiquetas/:id            → detalle
// POST   /api/admin/etiquetas                → crear   [solo admin]
// PUT    /api/admin/etiquetas/:id            → editar  [solo admin]
// DELETE /api/admin/etiquetas/:id            → eliminar [solo admin]

router.get(
  '/',
  validate(listEtiquetasQuerySchema, 'query'),
  listEtiquetas,
);
router.get(
  '/:id',
  validate(etiquetaIdParamSchema, 'params'),
  getEtiqueta,
);
router.post(
  '/',
  requireRole('admin'),
  validate(createEtiquetaSchema),
  createEtiqueta,
);
router.put(
  '/:id',
  requireRole('admin'),
  validate(etiquetaIdParamSchema, 'params'),
  validate(updateEtiquetaSchema),
  updateEtiqueta,
);
router.delete(
  '/:id',
  requireRole('admin'),
  validate(etiquetaIdParamSchema, 'params'),
  deleteEtiqueta,
);

// ─── Etiquetas de una pregunta ────────────────────────────────────────────────
// GET  /api/admin/preguntas/:preguntaId/etiquetas          → listado de etiquetas de la pregunta
// PUT  /api/admin/preguntas/:preguntaId/etiquetas          → reemplazar etiquetas (array completo)

router.get(
  '/preguntas/:preguntaId/etiquetas',
  validate(preguntaEtiquetasParamSchema, 'params'),
  getEtiquetasDePregunta,
);
router.put(
  '/preguntas/:preguntaId/etiquetas',
  validate(preguntaEtiquetasParamSchema, 'params'),
  validate(setEtiquetasDePreguntaSchema),
  setEtiquetasDePregunta,
);

export default router;
