import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetRendimientoEficienciaService = {
  async getRitmoPregunta(userId, oposicionId = null) {
    return widgetStatsRepository.getRitmoPregunta(userId, oposicionId);
  },

  async getEficienciaTiempo(userId, oposicionId = null) {
    return widgetStatsRepository.getEficienciaTiempo(userId, oposicionId);
  },
};
