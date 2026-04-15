import { created, ok } from '../utils/response.js';
import { testService } from '../services/test.service.js';
import { testRecomendadoService } from '../services/testRecomendado.service.js';
import { historyQuerySchema, reviewParamsSchema } from '../schemas/test.schema.js';
import { ApiError } from '../utils/api-error.js';
import { PLAN_LIMITS } from '../config/plans.config.js';

export const generateTest = async (req, res, next) => {
  try {
    const plan = req.user.plan ?? 'free';
    const limits = PLAN_LIMITS[plan];
    const { modo, numeroPreguntas } = req.body;

    // Bloquear modos no permitidos en el plan
    if (modo && !limits.modesAllowed.includes(modo)) {
      const bloqueado = modo === 'simulacro' ? 'los simulacros' : `el modo ${modo}`;
      return next(new ApiError(403, `Tu plan actual (${plan}) no incluye ${bloqueado}. Actualiza a pro o superior.`));
    }

    // Limitar número de preguntas
    const numPreguntasFinal = Math.min(numeroPreguntas, limits.maxPreguntasPorTest);

    const data = await testService.generate({
      userId: req.user.userId,
      ...req.body,
      numeroPreguntas: numPreguntasFinal,
    });
    return created(res, data, 'Test generado');
  } catch (error) {
    return next(error);
  }
};

export const generateRefuerzo = async (req, res, next) => {
  try {
    const data = await testService.generateRefuerzo({ userId: req.user.userId, ...req.body });
    return created(res, data, 'Test de refuerzo generado');
  } catch (error) {
    return next(error);
  }
};

export const submitTest = async (req, res, next) => {
  try {
    const data = await testService.submit({ userId: req.user.userId, ...req.body });
    return ok(res, data, 'Test enviado y corregido');
  } catch (error) {
    return next(error);
  }
};

export const getTestHistory = async (req, res, next) => {
  try {
    const plan = req.user.plan ?? 'free';
    const limits = PLAN_LIMITS[plan];
    const { limit, page, oposicion_id, desde, hasta } = historyQuerySchema.parse(req.query);

    // Plan free: máximo 5 tests en historial, siempre página 1
    const effectiveLimit = limits.maxHistorial === Infinity ? limit : Math.min(limit, limits.maxHistorial);
    const effectivePage = limits.maxHistorial === Infinity ? page : 1;

    const data = await testService.getHistory({
      userId: req.user.userId,
      limit: effectiveLimit,
      page: effectivePage,
      oposicionId: oposicion_id,
      desde,
      hasta,
    });
    return ok(res, { ...data, planLimit: limits.maxHistorial === Infinity ? null : limits.maxHistorial });
  } catch (error) {
    return next(error);
  }
};

export const getTestReview = async (req, res, next) => {
  try {
    const { testId } = reviewParamsSchema.parse(req.params);
    const data = await testService.getReview({ userId: req.user.userId, testId });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getTestConfig = async (req, res, next) => {
  try {
    const { testId } = reviewParamsSchema.parse(req.params);
    const data = await testService.getConfig({ userId: req.user.userId, testId });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getTestRecomendado = async (req, res, next) => {
  try {
    const plan = req.user.plan ?? 'free';
    const data = await testRecomendadoService.getSugerencia(req.user.userId, plan);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};