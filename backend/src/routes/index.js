import { Router } from 'express';
import authRoutes from './v1/auth.routes.js';
import catalogRoutes from './v1/catalog.routes.js';
import testRoutes from './v1/tests.routes.js';
import statsRoutes from './v1/stats.routes.js';
import adminRoutes from './v1/admin.routes.js';
import repasoRoutes from './v1/repaso.routes.js';
import marcadasRoutes from './v1/marcadas.routes.js';
import reportesRoutes from './v1/reportes.routes.js';
import subscriptionRoutes from './v1/subscription.routes.js';
import accesosRoutes from './v1/accesos.routes.js';
import billingRoutes from './v1/billing.routes.js';
import notificacionesRoutes from './v1/notificaciones.routes.js';
import profesorRoutes from './v1/profesor.routes.js';
import planEstudioRoutes from './v1/planEstudio.routes.js';
import simulacrosRoutes from './v1/simulacros.routes.js';
import misTestsRoutes from './v1/misTests.routes.js';
import albacerRoutes from './v1/albacer.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  return res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/', catalogRoutes);
router.use('/tests', testRoutes);
router.use('/stats', statsRoutes);
router.use('/admin', adminRoutes);
router.use('/repaso', repasoRoutes);
router.use('/marcadas', marcadasRoutes);
router.use('/preguntas/:preguntaId/reportar', reportesRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/accesos', accesosRoutes);
router.use('/billing', billingRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/profesor', profesorRoutes);
router.use('/plan-estudio', planEstudioRoutes);
router.use('/simulacros', simulacrosRoutes);
router.use('/mis-tests', misTestsRoutes);
router.use('/albacer', albacerRoutes);

export default router;
