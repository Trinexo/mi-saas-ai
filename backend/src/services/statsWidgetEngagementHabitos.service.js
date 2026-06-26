import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetEngagementHabitosService = {
  async getGamificacion(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getGamificacion(userId, oposicionId, options);
  },

  async getObjetivoDiario(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getObjetivoDiario(userId, oposicionId, options);
  },

  async getRacha(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getRacha(userId, oposicionId, options);
  },

  async getRachaBloques(userId) {
    return widgetStatsRepository.getRachaBloques(userId);
  },
};
