import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createAlbacerModuloItem,
  createAlbacerModuloTest,
  createAlbacerModulo,
  deleteAlbacerModuloItem,
  deleteAlbacerModulo,
  getAlbacerModuloUsedQuestions,
  getAlbacerModulo,
  listAlbacerModuloItems,
  listAlbacerModulos,
  updateAlbacerModuloItem,
  updateAlbacerModulo,
} from '../../controllers/albacerModulos.controller.js';
import {
  albacerModuloItemIdParamSchema,
  albacerModuloIdParamSchema,
  createAlbacerModuloItemSchema,
  createAlbacerModuloTestSchema,
  createAlbacerModuloSchema,
  albacerModuloUsedQuestionsQuerySchema,
  listAlbacerModulosQuerySchema,
  updateAlbacerModuloItemSchema,
  updateAlbacerModuloSchema,
} from '../../schemas/albacerModulos.schema.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/modulos', validate(listAlbacerModulosQuerySchema, 'query'), listAlbacerModulos);
router.get('/modulos/:id', validate(albacerModuloIdParamSchema, 'params'), getAlbacerModulo);
router.get(
  '/modulos/:id/preguntas-usadas',
  validate(albacerModuloIdParamSchema, 'params'),
  validate(albacerModuloUsedQuestionsQuerySchema, 'query'),
  getAlbacerModuloUsedQuestions,
);
router.post(
  '/modulos/:id/tests',
  validate(albacerModuloIdParamSchema, 'params'),
  validate(createAlbacerModuloTestSchema, 'body'),
  createAlbacerModuloTest,
);
router.get('/modulos/:id/items', validate(albacerModuloIdParamSchema, 'params'), listAlbacerModuloItems);
router.post(
  '/modulos/:id/items',
  validate(albacerModuloIdParamSchema, 'params'),
  validate(createAlbacerModuloItemSchema, 'body'),
  createAlbacerModuloItem,
);
router.put(
  '/modulos/:id/items/:itemId',
  validate(albacerModuloItemIdParamSchema, 'params'),
  validate(updateAlbacerModuloItemSchema, 'body'),
  updateAlbacerModuloItem,
);
router.delete(
  '/modulos/:id/items/:itemId',
  validate(albacerModuloItemIdParamSchema, 'params'),
  deleteAlbacerModuloItem,
);
router.post('/modulos', validate(createAlbacerModuloSchema, 'body'), createAlbacerModulo);
router.put(
  '/modulos/:id',
  validate(albacerModuloIdParamSchema, 'params'),
  validate(updateAlbacerModuloSchema, 'body'),
  updateAlbacerModulo,
);
router.delete('/modulos/:id', validate(albacerModuloIdParamSchema, 'params'), deleteAlbacerModulo);

export default router;
