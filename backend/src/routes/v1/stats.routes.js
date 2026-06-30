import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDashboard, getUserStats, getBloqueStats, getRepasoStats, getSimulacrosStats, getEvolucion, getRacha, getRachaBloques, getResumenOposicion, getProgresoBloques, getProgresoBloquesByTema, getDetalleBloque, getMisOposiciones, getObjetivoDiario, getGamificacion, getFocoHoy, getResumenSemana, getActividad14Dias, getTemasDebiles, getProgresoTemas, getProgresoTemasReal, getInsightMensual, getProgresoSemanal, getEficienciaTiempo, getBalancePrecision, getRitmoPregunta, getConsistenciaDiaria } from '../../controllers/stats.controller.js';
import { getRanking, getProgresoTemaReal } from '../../controllers/statsProgresoTema.controller.js';
import {
  bloqueStatsQuerySchema,
  repasoStatsQuerySchema,
  simulacrosStatsQuerySchema,
  evolucionQuerySchema,
  statsBloqueDetalleParamsSchema,
  statsContextQuerySchema,
  statsOposicionContextQuerySchema,
  statsRankingQuerySchema,
  statsTemaContextQuerySchema,
} from '../../schemas/stats.schema.js';

const router = Router();

router.get('/dashboard', requireAuth, validate(statsContextQuerySchema, 'query'), getDashboard);
router.get('/consistencia-diaria', requireAuth, validate(statsContextQuerySchema, 'query'), getConsistenciaDiaria);
router.get('/ritmo-pregunta', requireAuth, validate(statsContextQuerySchema, 'query'), getRitmoPregunta);
router.get('/balance-precision', requireAuth, validate(statsContextQuerySchema, 'query'), getBalancePrecision);
router.get('/eficiencia-tiempo', requireAuth, validate(statsContextQuerySchema, 'query'), getEficienciaTiempo);
router.get('/progreso-semanal', requireAuth, validate(statsContextQuerySchema, 'query'), getProgresoSemanal);
router.get('/insight-mensual', requireAuth, validate(statsContextQuerySchema, 'query'), getInsightMensual);
router.get('/temas-debiles', requireAuth, validate(statsContextQuerySchema, 'query'), getTemasDebiles);
router.get('/progreso-temas', requireAuth, validate(statsContextQuerySchema, 'query'), getProgresoTemas);
router.get('/progreso-temas-real', requireAuth, validate(statsContextQuerySchema, 'query'), getProgresoTemasReal);
router.get('/progreso-tema-real', requireAuth, validate(statsTemaContextQuerySchema, 'query'), getProgresoTemaReal);
router.get('/actividad-14dias', requireAuth, validate(statsContextQuerySchema, 'query'), getActividad14Dias);
router.get('/resumen-semana', requireAuth, validate(statsContextQuerySchema, 'query'), getResumenSemana);
router.get('/foco-hoy', requireAuth, validate(statsContextQuerySchema, 'query'), getFocoHoy);
router.get('/objetivo-diario', requireAuth, validate(statsContextQuerySchema, 'query'), getObjetivoDiario);
router.get('/gamificacion', requireAuth, validate(statsContextQuerySchema, 'query'), getGamificacion);
router.get('/user', requireAuth, validate(statsContextQuerySchema, 'query'), getUserStats);
router.get('/bloque', requireAuth, validate(bloqueStatsQuerySchema, 'query'), getBloqueStats);
router.get('/repaso', requireAuth, validate(repasoStatsQuerySchema, 'query'), getRepasoStats);
router.get('/simulacros', requireAuth, validate(simulacrosStatsQuerySchema, 'query'), getSimulacrosStats);
router.get('/evolucion', requireAuth, validate(evolucionQuerySchema, 'query'), getEvolucion);
router.get('/racha', requireAuth, validate(statsContextQuerySchema, 'query'), getRacha);
router.get('/racha-bloques', requireAuth, validate(statsContextQuerySchema, 'query'), getRachaBloques);
router.get('/resumen-oposicion', requireAuth, validate(statsOposicionContextQuerySchema, 'query'), getResumenOposicion);
router.get('/progreso-bloques', requireAuth, validate(statsContextQuerySchema, 'query'), getProgresoBloques);
router.get('/progreso-bloques-tema', requireAuth, validate(statsTemaContextQuerySchema, 'query'), getProgresoBloquesByTema);
router.get('/bloque/:id/detalle', requireAuth, validate(statsBloqueDetalleParamsSchema, 'params'), validate(statsContextQuerySchema, 'query'), getDetalleBloque);
router.get('/mis-oposiciones', requireAuth, getMisOposiciones);
router.get('/ranking', requireAuth, validate(statsRankingQuerySchema, 'query'), getRanking);

export default router;
