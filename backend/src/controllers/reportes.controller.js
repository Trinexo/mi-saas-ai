import { created, ok } from '../utils/response.js';
import { reportesService } from '../services/reportes.service.js';

export const reportarPregunta = async (req, res, next) => {
  try {
    const result = await reportesService.reportar(
      req.user.userId,
      req.params.preguntaId,
      req.body.motivo,
    );
    if (result.already) return ok(res, result, 'Ya habías reportado esta pregunta');
    return created(res, result, 'Reporte enviado correctamente');
  } catch (error) {
    return next(error);
  }
};
