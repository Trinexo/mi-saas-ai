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
    const temaIds = String(query.tema_ids ?? '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
    const anioIds = String(query.anio_ids ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value));
    const examenIds = String(query.examen_ids ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value));
    const { rows, total } = await profesorDashboardRepository.getMisPreguntas(userId, {
      oposicionId: query.oposicion_id ?? null,
      temaId: query.tema_id ?? null,
      temaIds: temaIds.length ? [...new Set(temaIds)] : null,
      nivelDificultad: query.nivel_dificultad ?? null,
      estado: query.estado ?? null,
      q: query.q ?? null,
      officialidad: query.officialidad ?? 'all',
      anio: query.anio ?? null,
      anioIds: anioIds.length ? [...new Set(anioIds)] : [],
      examenId: query.examen_id ?? null,
      examenIds: examenIds.length ? [...new Set(examenIds)] : [],
      page,
      pageSize,
    });
    return {
      items: rows,
      pagination: { page, pageSize, total },
    };
  },
};
