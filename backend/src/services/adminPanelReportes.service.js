import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelReportesService = {
  async listAuditoria(query, actor) {
    if (!actor || actor.role !== 'admin') {
      throw new ApiError(403, 'Acceso denegado');
    }

    const { page, page_size: pageSize, pregunta_id: preguntaId, usuario_id: usuarioId, accion } = query;
    const filters = {
      preguntaId: preguntaId ?? null,
      usuarioId: usuarioId ?? null,
      accion: accion ?? null,
    };

    const [items, total] = await Promise.all([
      adminRepository.listAuditoria(filters, pageSize, (page - 1) * pageSize),
      adminRepository.countAuditoria(filters),
    ]);

    return {
      items,
      pagination: { page, pageSize, total },
    };
  },

  async listReportes(query) {
    const { page, page_size: pageSize, estado = null } = query;

    const [items, total] = await Promise.all([
      adminRepository.listReportes({ estado }, pageSize, (page - 1) * pageSize),
      adminRepository.countReportes({ estado }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  },

  async updateReporteEstado(reporteId, estado) {
    const updated = await adminRepository.updateReporteEstado(reporteId, estado);
    if (!updated) {
      throw new ApiError(404, 'Reporte no encontrado');
    }

    return { id: reporteId, estado };
  },
};
