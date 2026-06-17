import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetEngagementActividadService = {
  async getConsistenciaDiaria(userId, oposicionId = null) {
    return widgetStatsRepository.getConsistenciaDiaria(userId, oposicionId);
  },

  async getProgresoSemanal(userId, oposicionId = null) {
    return widgetStatsRepository.getProgresoSemanal(userId, oposicionId);
  },

  async getActividad14Dias(userId, oposicionId = null) {
    return widgetStatsRepository.getActividad14Dias(userId, oposicionId);
  },

  async getResumenSemana(userId, oposicionId = null) {
    return widgetStatsRepository.getResumenSemana(userId, oposicionId);
  },

  async getFocoHoy(userId) {
    return widgetStatsRepository.getFocoHoy(userId);
  },
};
