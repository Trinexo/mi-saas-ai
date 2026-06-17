import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetRendimientoCalidadService = {
  async getBalancePrecision(userId, oposicionId = null) {
    return widgetStatsRepository.getBalancePrecision(userId, oposicionId);
  },

  async getInsightMensual(userId, oposicionId = null) {
    return widgetStatsRepository.getInsightMensual(userId, oposicionId);
  },

  async getTemasDebiles(userId, oposicionId = null) {
    return widgetStatsRepository.getTemasDebiles(userId, oposicionId);
  },
};
