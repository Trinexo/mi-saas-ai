// Barrel de compatibilidad - las rutas se han dividido en adminCatalogo y adminGestion.
import { Router } from 'express';
import catalogoRouter from './adminCatalogo.routes.js';
import gestionRouter from './adminGestion.routes.js';
import settingsRouter from './adminSettings.routes.js';

const router = Router();
router.use(catalogoRouter);
router.use(gestionRouter);
router.use('/settings', settingsRouter);

export default router;
