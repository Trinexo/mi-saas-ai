import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { marcadaParamsSchema } from '../../schemas/marcadas.schema.js';
import { marcarPregunta, desmarcarPregunta, getMarcadas } from '../../controllers/marcadas.controller.js';

const router = Router();

router.get('/', requireAuth, getMarcadas);
router.post('/:preguntaId', requireAuth, validate(marcadaParamsSchema, 'params'), marcarPregunta);
router.delete('/:preguntaId', requireAuth, validate(marcadaParamsSchema, 'params'), desmarcarPregunta);

export default router;
