import { created, ok } from '../utils/response.js';
import { authService } from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    return created(res, user, 'Usuario registrado');
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const auth = await authService.login(req.body);
    return ok(res, auth, 'Login correcto');
  } catch (error) {
    return next(error);
  }
};