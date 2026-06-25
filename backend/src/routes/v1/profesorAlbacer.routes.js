import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createAlbacerModulo,
  deleteAlbacerModulo,
  getAlbacerModulo,
  listAlbacerModulos,
  updateAlbacerModulo,
} from '../../controllers/albacerModulos.controller.js';
import {
  albacerModuloIdParamSchema,
  createAlbacerModuloSchema,
  listAlbacerModulosQuerySchema,
  updateAlbacerModuloSchema,
} from '../../schemas/albacerModulos.schema.js';

const router = Router();

router.get('/modulos', validate(listAlbacerModulosQuerySchema, 'query'), listAlbacerModulos);
router.get('/modulos/:id', validate(albacerModuloIdParamSchema, 'params'), getAlbacerModulo);
router.post('/modulos', validate(createAlbacerModuloSchema, 'body'), createAlbacerModulo);
router.put(
  '/modulos/:id',
  validate(albacerModuloIdParamSchema, 'params'),
  validate(updateAlbacerModuloSchema, 'body'),
  updateAlbacerModulo,
);
router.delete('/modulos/:id', validate(albacerModuloIdParamSchema, 'params'), deleteAlbacerModulo);

export default router;
