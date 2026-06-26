import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetRendimientoEficienciaService = {
  async getRitmoPregunta(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getRitmoPregunta(userId, oposicionId, options);
  },

  async getEficienciaTiempo(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getEficienciaTiempo(userId, oposicionId, options);
  },
};
