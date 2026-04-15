import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  listNotificaciones,
  countNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} from '../../controllers/notificaciones.controller.js';
import {
  listNotificacionesQuerySchema,
  notificacionIdParamSchema,
} from '../../schemas/notificaciones.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/',          validate(listNotificacionesQuerySchema, 'query'), listNotificaciones);
router.get('/sin-leer',  countNoLeidas);
router.patch('/leer-todas', marcarTodasLeidas);
router.patch('/:id/leer', validate(notificacionIdParamSchema, 'params'), marcarLeida);

export default router;
