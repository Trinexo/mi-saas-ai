import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelUsersListService = {
  async listUsers(query) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows, total } = await adminRepository.listUsers(
      { role: query.role, q: query.q, excludeRole: query.exclude_role },
      pageSize,
      offset,
    );
    return {
      items: rows.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        role: u.role,
        plan: u.plan ?? 'free',
        fechaRegistro: u.fecha_registro,
      })),
      pagination: { page, pageSize, total },
    };
  },
};