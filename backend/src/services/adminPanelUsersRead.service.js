import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelUsersReadService = {
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

  async getTemasConMasErrores(limit = 10) {
    return adminRepository.getTemasConMasErrores(limit);
  },
};
