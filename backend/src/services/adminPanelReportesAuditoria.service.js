import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelReportesAuditoriaService = {
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
      adminRepository.listAuditoria({ page, pageSize, preguntaId, usuarioId, accion }),
      adminRepository.countAuditoria({ preguntaId, usuarioId, accion }),
    ]);

    return {
      items,
      pagination: { page, pageSize, total },
    };
  },
};