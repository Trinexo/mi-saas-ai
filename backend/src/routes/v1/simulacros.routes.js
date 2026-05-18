import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { loadUserPlan, requirePlan } from '../../middleware/plan.middleware.js';
import { getSimulacrosPublicados, iniciarSimulacroPublicado } from '../../controllers/simulacrosPublicos.controller.js';

const router = Router();

// GET  /api/simulacros          → lista simulacros publicados accesibles al usuario
router.get('/', requireAuth, getSimulacrosPublicados);

// POST /api/simulacros/:id/iniciar → genera sesión de test a partir de simulacro publicado
router.post('/:id/iniciar', requireAuth, loadUserPlan, requirePlan('pro', 'los simulacros'), iniciarSimulacroPublicado);

export default router;
