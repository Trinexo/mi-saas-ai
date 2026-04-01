import { widgetStatsRepository } from '../repositories/widgetStats.repository.js';
import { progressStatsRepository } from '../repositories/progressStats.repository.js';
import { ApiError } from '../utils/api-error.js';

export const statsService = {
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

  async getProgresoTemas(userId, oposicionId) {
    return progressStatsRepository.getProgresoTemas(userId, oposicionId ?? null);
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

  async getDashboard(userId) {
    return progressStatsRepository.getDashboard(userId);
  },

  async getUserStats(userId) {
    return progressStatsRepository.getUserStats(userId);
  },

  async getTemaStats(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0) {
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    }

    return progressStatsRepository.getTemaStats(userId, temaId);
  },

  async getRepasoStats(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0) {
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    }

    return progressStatsRepository.getRepasoStats(userId, temaId);
  },

  async getSimulacrosStats(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0) {
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    }

    return progressStatsRepository.getSimulacrosStats(userId, oposicionId);
  },

  async getEvolucion(userId, limit = 30) {
    return progressStatsRepository.getEvolucion(userId, limit);
  },

  async getRacha(userId) {
    return widgetStatsRepository.getRacha(userId);
  },

  async getRachaTemas(userId) {
    return widgetStatsRepository.getRachaTemas(userId);
  },

  async getResumenOposicion(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0) {
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    }
    return progressStatsRepository.getResumenOposicion(userId, oposicionId);
  },

  async getProgresoMaterias(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0) {
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    }
    return progressStatsRepository.getProgresoMaterias(userId, oposicionId);
  },

  async getProgresoTemasByMateria(userId, materiaId) {
    if (!Number.isInteger(materiaId) || materiaId <= 0) {
      throw new ApiError(400, 'materia_id debe ser un entero positivo');
    }
    return progressStatsRepository.getProgresoTemasByMateria(userId, materiaId);
  },

  async getDetalleTema(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0) {
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    }
    const data = await progressStatsRepository.getDetalleTema(userId, temaId);
    if (!data) throw new ApiError(404, 'Tema no encontrado');
    return data;
  },

  async getMisOposiciones(userId) {
    return progressStatsRepository.getMisOposiciones(userId);
  },
};