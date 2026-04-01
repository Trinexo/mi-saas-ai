import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';

export const statsWidgetService = {
  async getConsistenciaDiaria(userId) {
    return widgetStatsRepository.getConsistenciaDiaria(userId);
  },

  async getRitmoPregunta(userId) {
    return widgetStatsRepository.getRitmoPregunta(userId);
  },

  async getBalancePrecision(userId) {
    return widgetStatsRepository.getBalancePrecision(userId);
  },

  async getEficienciaTiempo(userId) {
    return widgetStatsRepository.getEficienciaTiempo(userId);
  },

  async getProgresoSemanal(userId) {
    return widgetStatsRepository.getProgresoSemanal(userId);
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
