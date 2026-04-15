import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { adminReportesPreguntasRepository } from '../repositories/adminReportesPreguntas.repository.js';
import { notificacionesService } from './notificaciones.service.js';

export const adminPanelReportesEstadoService = {
  async updateReporteEstado(reporteId, estado, mensajeAdmin) {
    // Leer datos antes de actualizar para generar la notificación
    const reporte = await adminReportesPreguntasRepository.getReporteById(reporteId);

    const updated = await adminRepository.updateReporteEstado(reporteId, estado);
    if (!updated) {
      throw new ApiError(404, 'Reporte no encontrado');
    }

    // Notificar al usuario si el estado es final
    if (reporte && (estado === 'resuelto' || estado === 'descartado')) {
      await notificacionesService.crearNotificacionReporte({
        usuarioId: reporte.usuario_id,
        reporteId,
        preguntaEnunciado: reporte.pregunta_enunciado,
        nuevoEstado: estado,
        mensajeAdmin: mensajeAdmin || null,
      }).catch(() => {});
    }

    return { id: reporteId, estado };
  },
};