import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getUserStats, getTemaStats } from '../../controllers/stats.controller.js';

const router = Router();

router.get('/user', requireAuth, getUserStats);
router.get('/tema', requireAuth, getTemaStats);

export default router;