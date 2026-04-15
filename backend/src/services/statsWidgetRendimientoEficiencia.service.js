import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetRendimientoEficienciaService = {
  async getRitmoPregunta(userId) {
    return widgetStatsRepository.getRitmoPregunta(userId);
  },

  async getEficienciaTiempo(userId) {
    return widgetStatsRepository.getEficienciaTiempo(userId);
  },

  async getRendimientoModos(userId) {
    return widgetStatsRepository.getRendimientoModos(userId);
  },
};