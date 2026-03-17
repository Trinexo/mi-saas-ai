import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { repasoPendientesQuerySchema } from '../../schemas/repaso.schema.js';
import { getRepasoPendientes } from '../../controllers/repaso.controller.js';

const router = Router();

router.get('/pendientes', requireAuth, validate(repasoPendientesQuerySchema, 'query'), getRepasoPendientes);

export default router;
