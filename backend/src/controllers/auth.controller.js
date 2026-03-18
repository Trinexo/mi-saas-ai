import { created, ok, noContent } from '../utils/response.js';
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

export const getMe = async (req, res, next) => {
  try {
    const data = await authService.getMe(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const data = await authService.updateProfile(req.user.userId, req.body);
    return ok(res, data, 'Perfil actualizado');
  } catch (error) {
    return next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    await authService.updatePassword(req.user.userId, req.body);
    return noContent(res);
  } catch (error) {
    return next(error);
  }
};