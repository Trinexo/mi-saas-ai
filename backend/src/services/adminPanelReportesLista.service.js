import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelReportesListaService = {
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
};