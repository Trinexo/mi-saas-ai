import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetEngagementService = {
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

  async getGamificacion(userId) {
    return widgetStatsRepository.getGamificacion(userId);
  },

  async getObjetivoDiario(userId) {
    return widgetStatsRepository.getObjetivoDiario(userId);
  },

  async getRacha(userId) {
    return widgetStatsRepository.getRacha(userId);
  },

  async getRachaTemas(userId) {
    return widgetStatsRepository.getRachaTemas(userId);
  },
};
