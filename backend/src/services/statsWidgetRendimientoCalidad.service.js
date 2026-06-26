import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetRendimientoCalidadService = {
  async getBalancePrecision(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getBalancePrecision(userId, oposicionId, options);
  },

  async getInsightMensual(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getInsightMensual(userId, oposicionId, options);
  },

  async getTemasDebiles(userId, oposicionId = null) {
    return widgetStatsRepository.getTemasDebiles(userId, oposicionId);
  },
};
