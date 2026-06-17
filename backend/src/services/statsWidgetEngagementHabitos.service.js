import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetEngagementHabitosService = {
  async getGamificacion(userId, oposicionId = null) {
    return widgetStatsRepository.getGamificacion(userId, oposicionId);
  },

  async getObjetivoDiario(userId, oposicionId = null) {
    return widgetStatsRepository.getObjetivoDiario(userId, oposicionId);
  },

  async getRacha(userId, oposicionId = null) {
    return widgetStatsRepository.getRacha(userId, oposicionId);
  },

  async getRachaBloques(userId) {
    return widgetStatsRepository.getRachaBloques(userId);
  },
};
