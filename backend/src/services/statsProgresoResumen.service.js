import { progressStatsRepository } from '../repositories/progressStats.repository.js';

export const statsProgresoResumenService = {
  async getProgresoTemas(userId, oposicionId) {
    return progressStatsRepository.getProgresoTemas(userId, oposicionId ?? null);
  },

  async getDashboard(userId) {
    return progressStatsRepository.getDashboard(userId);
  },

  async getUserStats(userId) {
    return progressStatsRepository.getUserStats(userId);
  },

  async getEvolucion(userId, limit = 30) {
    return progressStatsRepository.getEvolucion(userId, limit);
  },

  async getMisOposiciones(userId) {
    return progressStatsRepository.getMisOposiciones(userId);
  },
};
