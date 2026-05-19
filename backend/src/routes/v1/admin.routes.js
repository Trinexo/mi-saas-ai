// Barrel de compatibilidad - las rutas se han dividido en adminCatalogo y adminGestion.
import { Router } from 'express';
import catalogoRouter from './adminCatalogo.routes.js';
import gestionRouter from './adminGestion.routes.js';
import settingsRouter from './adminSettings.routes.js';
import simulacrosRouter from './adminSimulacros.routes.js';
import etiquetasRouter from './adminEtiquetas.routes.js';
import testsRouter from './adminTests.routes.js';

const router = Router();
router.use(gestionRouter);
router.use('/settings', settingsRouter);
router.use('/simulacros', simulacrosRouter);
router.use('/etiquetas', etiquetasRouter);
router.use('/tests', testsRouter);
router.use(catalogoRouter);

export default router;
