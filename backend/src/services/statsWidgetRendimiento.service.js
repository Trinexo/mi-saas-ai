import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetRendimientoService = {
  async getRitmoPregunta(userId) {
    return widgetStatsRepository.getRitmoPregunta(userId);
  },

  async getBalancePrecision(userId) {
    return widgetStatsRepository.getBalancePrecision(userId);
  },

  async getEficienciaTiempo(userId) {
    return widgetStatsRepository.getEficienciaTiempo(userId);
  },

  async getRendimientoModos(userId) {
    return widgetStatsRepository.getRendimientoModos(userId);
  },

  async getInsightMensual(userId) {
    return widgetStatsRepository.getInsightMensual(userId);
  },

  async getTemasDebiles(userId) {
    return widgetStatsRepository.getTemasDebiles(userId);
  },
};
