import { repasoRepository } from '../repositories/repaso.repository.js';

export const repasoService = {
  async getPendientes(userId, limit = 20) {
    return repasoRepository.getPendientes(userId, limit);
  },

  /**
   * Actualiza el algoritmo SM-2 para un batch de respuestas.
   * respuestas: Array<{ preguntaId: number, acertada: boolean }>
   */
  async actualizarBatch(userId, respuestas) {
    return repasoRepository.actualizarBatch(userId, respuestas);
  },
};
