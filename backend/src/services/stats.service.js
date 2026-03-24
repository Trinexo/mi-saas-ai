import { statsRepository } from '../repositories/stats.repository.js';
import { ApiError } from '../utils/api-error.js';

export const statsService = {
  async getConsistenciaDiaria(userId) {
    return statsRepository.getConsistenciaDiaria(userId);
  },

  async getRitmoPregunta(userId) {
    return statsRepository.getRitmoPregunta(userId);
  },

  async getBalancePrecision(userId) {
    return statsRepository.getBalancePrecision(userId);
  },

  async getEficienciaTiempo(userId) {
    return statsRepository.getEficienciaTiempo(userId);
  },

  async getProgresoSemanal(userId) {
    return statsRepository.getProgresoSemanal(userId);
  },

  async getRendimientoModos(userId) {
    return statsRepository.getRendimientoModos(userId);
  },

  async getInsightMensual(userId) {
    return statsRepository.getInsightMensual(userId);
  },

  async getTemasDebiles(userId) {
    return statsRepository.getTemasDebiles(userId);
  },

  async getProgresoTemas(userId, oposicionId) {
    return statsRepository.getProgresoTemas(userId, oposicionId ?? null);
  },

  async getActividad14Dias(userId) {
    return statsRepository.getActividad14Dias(userId);
  },

  async getResumenSemana(userId) {
    return statsRepository.getResumenSemana(userId);
  },

  async getFocoHoy(userId) {
    return statsRepository.getFocoHoy(userId);
  },

  async getGamificacion(userId) {
    return statsRepository.getGamificacion(userId);
  },

  async getObjetivoDiario(userId) {
    return statsRepository.getObjetivoDiario(userId);
  },

  async getDashboard(userId) {
    return statsRepository.getDashboard(userId);
  },

  async getUserStats(userId) {
    return statsRepository.getUserStats(userId);
  },

  async getTemaStats(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0) {
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    }

    return statsRepository.getTemaStats(userId, temaId);
  },

  async getRepasoStats(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0) {
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    }

    return statsRepository.getRepasoStats(userId, temaId);
  },

  async getSimulacrosStats(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0) {
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    }

    return statsRepository.getSimulacrosStats(userId, oposicionId);
  },

  async getEvolucion(userId, limit = 30) {
    return statsRepository.getEvolucion(userId, limit);
  },

  async getRacha(userId) {
    return statsRepository.getRacha(userId);
  },

  async getRachaTemas(userId) {
    return statsRepository.getRachaTemas(userId);
  },

  async getResumenOposicion(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0) {
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    }
    return statsRepository.getResumenOposicion(userId, oposicionId);
  },
};