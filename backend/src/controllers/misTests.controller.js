import { ok, created } from '../utils/response.js';
import { misTestsService } from '../services/misTests.service.js';

export const getMisTestsPublicados = async (req, res, next) => {
  try {
    const plan = req.user.plan ?? 'free';
    const items = await misTestsService.getPublicados(req.user.userId, plan);
    return ok(res, items);
  } catch (err) {
    return next(err);
  }
};

export const iniciarMiTest = async (req, res, next) => {
  try {
    const testId = Number(req.params.id);
    const data = await misTestsService.iniciar(req.user.userId, testId);
    return created(res, data, 'Test iniciado');
  } catch (err) {
    return next(err);
  }
};
