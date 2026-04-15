import { profesorDashboardRepository } from '../repositories/profesorDashboard.repository.js';

export const profesorService = {
  async getDashboard(userId) {
    const [oposiciones, stats, actividad] = await Promise.all([
      profesorDashboardRepository.getOposicionesAsignadas(userId),
      profesorDashboardRepository.getStats(userId),
      profesorDashboardRepository.getActividadReciente(userId, 10),
    ]);
    return { oposiciones, stats, actividad };
  },

  async getMisOposiciones(userId) {
    return profesorDashboardRepository.getOposicionesAsignadas(userId);
  },

  async getMisPreguntas(userId, query) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const { rows, total } = await profesorDashboardRepository.getMisPreguntas(userId, {
      oposicionId: query.oposicion_id ?? null,
      estado: query.estado ?? null,
      q: query.q ?? null,
      page,
      pageSize,
    });
    return {
      items: rows,
      pagination: { page, pageSize, total },
    };
  },
};
