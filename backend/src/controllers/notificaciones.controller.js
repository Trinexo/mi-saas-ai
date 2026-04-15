import { ok } from '../utils/response.js';
import { notificacionesService } from '../services/notificaciones.service.js';

export const listNotificaciones = async (req, res, next) => {
  try {
    const { page, page_size: pageSize, solo_no_leidas } = req.query;
    const soloNoLeidas = solo_no_leidas === 'true';
    const data = await notificacionesService.list({
      usuarioId: req.user.userId,
      page,
      pageSize,
      soloNoLeidas,
    });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const countNoLeidas = async (req, res, next) => {
  try {
    const total = await notificacionesService.countNoLeidas(req.user.userId);
    return ok(res, { total });
  } catch (error) {
    return next(error);
  }
};

export const marcarLeida = async (req, res, next) => {
  try {
    await notificacionesService.marcarLeida(req.params.id, req.user.userId);
    return ok(res, null, 'Notificación marcada como leída');
  } catch (error) {
    return next(error);
  }
};

export const marcarTodasLeidas = async (req, res, next) => {
  try {
    const count = await notificacionesService.marcarTodasLeidas(req.user.userId);
    return ok(res, { marcadas: count }, 'Todas las notificaciones marcadas como leídas');
  } catch (error) {
    return next(error);
  }
};
