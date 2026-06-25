import { progressStatsRepository } from '../repositories/progressStats.repository.js';

export const statsProgresoResumenService = {
  async getProgresoBloques(userId, oposicionId) {
    return progressStatsRepository.getProgresoBloques(userId, oposicionId ?? null);
  },

  async getProgresoTemas(userId, oposicionId) {
    return progressStatsRepository.getProgresoTemas(userId, oposicionId ?? null);
  },

  async getProgresoTemasReal(userId, oposicionId) {
    return progressStatsRepository.getProgresoTemasReal(userId, oposicionId ?? null);
  },

  async getProgresoTemaReal(userId, temaId) {
    return progressStatsRepository.getProgresoTemaReal(userId, temaId);
  },

  async getDashboard(userId, oposicionId = null) {
    return progressStatsRepository.getDashboard(userId, oposicionId);
  },

  async getUserStats(userId, oposicionId = null, options = {}) {
    return progressStatsRepository.getUserStats(userId, oposicionId, options);
  },

  async getEvolucion(userId, limit = 30, oposicionId = null, options = {}) {
    return progressStatsRepository.getEvolucion(userId, limit, oposicionId, options);
  },

  async getMisOposiciones(userId) {
    return progressStatsRepository.getMisOposiciones(userId);
  },
};
