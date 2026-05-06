import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetEngagementHabitosService = {
  async getGamificacion(userId) {
    return widgetStatsRepository.getGamificacion(userId);
  },

  async getObjetivoDiario(userId) {
    return widgetStatsRepository.getObjetivoDiario(userId);
  },

  async getRacha(userId) {
    return widgetStatsRepository.getRacha(userId);
  },

  async getRachaBloques(userId) {
    return widgetStatsRepository.getRachaBloques(userId);
  },
};