import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getUserStats, getTemaStats } from '../../controllers/stats.controller.js';
import { temaStatsQuerySchema } from '../../schemas/stats.schema.js';

const router = Router();

router.get('/user', requireAuth, getUserStats);
router.get('/tema', requireAuth, validate(temaStatsQuerySchema, 'query'), getTemaStats);

export default router;