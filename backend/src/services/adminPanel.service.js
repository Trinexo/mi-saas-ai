import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelService = {
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

  async getAdminStats() {
    return adminRepository.getAdminStats();
  },

  async listUsers(query) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows, total } = await adminRepository.listUsers(
      { role: query.role, q: query.q },
      pageSize,
      offset,
    );
    return {
      items: rows.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        role: u.role,
        fechaRegistro: u.fecha_registro,
      })),
      pagination: { page, pageSize, total },
    };
  },

  async updateUserRole(userId, role, requestingUser) {
    if (Number(userId) === requestingUser.id) {
      throw new ApiError(400, 'No puedes cambiar tu propio rol');
    }
    const updated = await adminRepository.updateUserRole(userId, role);
    if (!updated) {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    return updated;
  },

  async getTemasConMasErrores(limit = 10) {
    return adminRepository.getTemasConMasErrores(limit);
  },
};
