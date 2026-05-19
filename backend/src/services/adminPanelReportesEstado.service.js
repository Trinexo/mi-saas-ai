import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { adminReportesPreguntasRepository } from '../repositories/adminReportesPreguntas.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { notificacionesService } from './notificaciones.service.js';

export const adminPanelReportesEstadoService = {
  async updateReporteEstado(reporteId, estado, mensajeAdmin, caller = {}) {
    const reporte = await adminReportesPreguntasRepository.getReporteById(reporteId);
    if (!reporte) {
      throw new ApiError(404, 'Reporte no encontrado');
    }

    if (caller.role === 'profesor') {
      const asignada = await profesorAccessRepository.hasAssignedOposicion(caller.userId, reporte.oposicion_id);
      if (!asignada) throw new ApiError(403, 'No tienes permiso para gestionar este reporte');
    }

    const updated = await adminRepository.updateReporteEstado(reporteId, estado);
    if (!updated) {
      throw new ApiError(404, 'Reporte no encontrado');
    }

    if (estado === 'resuelto' || estado === 'descartado') {
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
