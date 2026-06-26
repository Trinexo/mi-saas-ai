import { repasoRepository } from '../repositories/repaso.repository.js';

export const repasoService = {
  async getPendientes(userId, limit = 20, oposicionId = null) {
    return repasoRepository.getPendientes(userId, limit, oposicionId);
  },

  /**
   * Actualiza el algoritmo SM-2 para un batch de respuestas.
   * respuestas: Array<{ preguntaId: number, acertada: boolean }>
   */
  async actualizarBatch(userId, respuestas) {
    return repasoRepository.actualizarBatch(userId, respuestas);
  },
};
