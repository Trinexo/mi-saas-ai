import { Router } from 'express';
import authRoutes from './v1/auth.routes.js';
import catalogRoutes from './v1/catalog.routes.js';
import testRoutes from './v1/tests.routes.js';
import statsRoutes from './v1/stats.routes.js';
import adminRoutes from './v1/admin.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  return res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/', catalogRoutes);
router.use('/tests', testRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);

export default router;