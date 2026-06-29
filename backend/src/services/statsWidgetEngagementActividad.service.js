import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetEngagementActividadService = {
  async getConsistenciaDiaria(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getConsistenciaDiaria(userId, oposicionId, options);
  },

  async getProgresoSemanal(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getProgresoSemanal(userId, oposicionId, options);
  },

  async getActividad14Dias(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getActividad14Dias(userId, oposicionId, options);
  },

  async getResumenSemana(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getResumenSemana(userId, oposicionId, options);
  },

  async getFocoHoy(userId, oposicionId = null, options = {}) {
    return widgetStatsRepository.getFocoHoy(userId, oposicionId, options);
  },
};
