// Barrel de compatibilidad - las rutas se han dividido en adminCatalogo y adminGestion.
import { Router } from 'express';
import catalogoRouter from './adminCatalogo.routes.js';
import gestionRouter from './adminGestion.routes.js';

const router = Router();
router.use(catalogoRouter);
router.use(gestionRouter);

export default router;
