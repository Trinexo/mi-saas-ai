import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { reportarPreguntaParamsSchema, reportarPreguntaBodySchema } from '../../schemas/reportes.schema.js';
import { reportarPregunta } from '../../controllers/reportes.controller.js';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, validate(reportarPreguntaParamsSchema, 'params'), validate(reportarPreguntaBodySchema), reportarPregunta);

export default router;
