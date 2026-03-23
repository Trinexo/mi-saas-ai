import { created, ok } from '../utils/response.js';
import { testService } from '../services/test.service.js';
import { historyQuerySchema, reviewParamsSchema } from '../schemas/test.schema.js';

export const generateTest = async (req, res, next) => {
  try {
    const data = await testService.generate({ userId: req.user.userId, ...req.body });
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
    const { limit, page, oposicion_id, desde, hasta } = historyQuerySchema.parse(req.query);
    const data = await testService.getHistory({
      userId: req.user.userId,
      limit,
      page,
      oposicionId: oposicion_id,
      desde,
      hasta,
    });
    return ok(res, data);
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