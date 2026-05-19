import { adminRepository } from '../repositories/admin.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';

export const adminPanelReportesListaService = {
  async listReportes(query, caller = {}) {
    const { page, page_size: pageSize, estado = null } = query;
    const filters = { estado };

    if (caller.role === 'profesor') {
      filters.oposicionIds = await profesorAccessRepository.listAssignedOposicionIds(caller.userId);
    }

    const [items, total] = await Promise.all([
      adminRepository.listReportes(filters, pageSize, (page - 1) * pageSize),
      adminRepository.countReportes(filters),
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
};
