import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createAlbacerModuloItem,
  createAlbacerModulo,
  deleteAlbacerModuloItem,
  deleteAlbacerModulo,
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
  createAlbacerModuloSchema,
  listAlbacerModulosQuerySchema,
  updateAlbacerModuloItemSchema,
  updateAlbacerModuloSchema,
} from '../../schemas/albacerModulos.schema.js';

const router = Router();

router.get('/modulos', validate(listAlbacerModulosQuerySchema, 'query'), listAlbacerModulos);
router.get('/modulos/:id', validate(albacerModuloIdParamSchema, 'params'), getAlbacerModulo);
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
