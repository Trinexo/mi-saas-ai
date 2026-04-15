import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetRendimientoCalidadService = {
  async getBalancePrecision(userId) {
    return widgetStatsRepository.getBalancePrecision(userId);
  },

  async getInsightMensual(userId) {
    return widgetStatsRepository.getInsightMensual(userId);
  },

  async getTemasDebiles(userId) {
    return widgetStatsRepository.getTemasDebiles(userId);
  },
};