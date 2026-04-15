import { created, ok, noContent } from '../utils/response.js';
import { authService } from '../services/auth.service.js';
import { authPasswordResetService } from '../services/authPasswordReset.service.js';

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

export const patchOposicionPreferida = async (req, res, next) => {
  try {
    const data = await authService.updateProfile(req.user.userId, {
      oposicionPreferidaId: req.body.oposicionPreferidaId ?? null,
    });
    return ok(res, data, 'Oposición preferida actualizada');
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authPasswordResetService.forgotPassword({ email: req.body.email });
    // Siempre responder OK para no revelar si el email existe
    return ok(res, null, 'Si el email está registrado recibirás un enlace en breve');
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authPasswordResetService.resetPassword(req.body);
    return ok(res, null, 'Contraseña actualizada correctamente');
  } catch (error) {
    return next(error);
  }
};