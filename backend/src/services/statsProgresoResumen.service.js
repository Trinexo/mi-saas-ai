import { progressStatsRepository } from '../repositories/progressStats.repository.js';

export const statsProgresoResumenService = {
  async getProgresoBloques(userId, oposicionId, options = {}) {
    return progressStatsRepository.getProgresoBloques(userId, oposicionId ?? null, options);
  },

  async getProgresoTemas(userId, oposicionId, options = {}) {
    return progressStatsRepository.getProgresoTemas(userId, oposicionId ?? null, options);
  },

  async getProgresoTemasReal(userId, oposicionId, options = {}) {
    return progressStatsRepository.getProgresoTemasReal(userId, oposicionId ?? null, options);
  },

  async getProgresoTemaReal(userId, temaId, options = {}) {
    return progressStatsRepository.getProgresoTemaReal(userId, temaId, options);
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
