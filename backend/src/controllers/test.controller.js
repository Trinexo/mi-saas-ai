import { created, ok } from '../utils/response.js';
import { testService } from '../services/test.service.js';

export const generateTest = async (req, res, next) => {
  try {
    const data = await testService.generate({ userId: req.user.userId, ...req.body });
    return created(res, data, 'Test generado');
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