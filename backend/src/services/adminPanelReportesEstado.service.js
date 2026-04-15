import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelReportesEstadoService = {
  async updateReporteEstado(reporteId, estado) {
    const updated = await adminRepository.updateReporteEstado(reporteId, estado);
    if (!updated) {
      throw new ApiError(404, 'Reporte no encontrado');
    }

    return { id: reporteId, estado };
  },
};