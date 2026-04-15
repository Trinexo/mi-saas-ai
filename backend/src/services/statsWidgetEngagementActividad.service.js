import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetEngagementActividadService = {
  async getConsistenciaDiaria(userId) {
    return widgetStatsRepository.getConsistenciaDiaria(userId);
  },

  async getProgresoSemanal(userId) {
    return widgetStatsRepository.getProgresoSemanal(userId);
  },

  async getActividad14Dias(userId) {
    return widgetStatsRepository.getActividad14Dias(userId);
  },

  async getResumenSemana(userId) {
    return widgetStatsRepository.getResumenSemana(userId);
  },

  async getFocoHoy(userId) {
    return widgetStatsRepository.getFocoHoy(userId);
  },
};