import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDashboard, getUserStats, getTemaStats, getRepasoStats, getSimulacrosStats, getEvolucion, getRacha, getObjetivoDiario, getGamificacion, getFocoHoy, getResumenSemana, getActividad14Dias, getTemasDebiles, getInsightMensual, getRendimientoModos, getProgresoSemanal, getEficienciaTiempo, getBalancePrecision, getRitmoPregunta, getConsistenciaDiaria } from '../../controllers/stats.controller.js';
import { temaStatsQuerySchema, repasoStatsQuerySchema, simulacrosStatsQuerySchema, evolucionQuerySchema } from '../../schemas/stats.schema.js';

const router = Router();

router.get('/dashboard', requireAuth, getDashboard);
router.get('/consistencia-diaria', requireAuth, getConsistenciaDiaria);
router.get('/ritmo-pregunta', requireAuth, getRitmoPregunta);
router.get('/balance-precision', requireAuth, getBalancePrecision);
router.get('/eficiencia-tiempo', requireAuth, getEficienciaTiempo);
router.get('/progreso-semanal', requireAuth, getProgresoSemanal);
router.get('/rendimiento-modos', requireAuth, getRendimientoModos);
router.get('/insight-mensual', requireAuth, getInsightMensual);
router.get('/temas-debiles', requireAuth, getTemasDebiles);
router.get('/actividad-14dias', requireAuth, getActividad14Dias);
router.get('/resumen-semana', requireAuth, getResumenSemana);
router.get('/foco-hoy', requireAuth, getFocoHoy);
router.get('/objetivo-diario', requireAuth, getObjetivoDiario);
router.get('/gamificacion', requireAuth, getGamificacion);
router.get('/user', requireAuth, getUserStats);
router.get('/tema', requireAuth, validate(temaStatsQuerySchema, 'query'), getTemaStats);
router.get('/repaso', requireAuth, validate(repasoStatsQuerySchema, 'query'), getRepasoStats);
router.get('/simulacros', requireAuth, validate(simulacrosStatsQuerySchema, 'query'), getSimulacrosStats);
router.get('/evolucion', requireAuth, validate(evolucionQuerySchema, 'query'), getEvolucion);
router.get('/racha', requireAuth, getRacha);

export default router;