import { ApiError } from '../utils/api-error.js';
import { marcadasRepository } from '../repositories/marcadas.repository.js';

export const marcadasService = {
  async marcar(userId, preguntaId) {
    if (!preguntaId || preguntaId < 1) {
      throw new ApiError(400, 'preguntaId inválido');
    }
    return marcadasRepository.marcar(userId, preguntaId);
  },

  async desmarcar(userId, preguntaId) {
    if (!preguntaId || preguntaId < 1) {
      throw new ApiError(400, 'preguntaId inválido');
    }
    return marcadasRepository.desmarcar(userId, preguntaId);
  },

  async getMarcadas(userId, oposicionId = null) {
    if (oposicionId != null && (!Number.isInteger(Number(oposicionId)) || Number(oposicionId) < 1)) {
      throw new ApiError(400, 'oposicion_id invalido');
    }
    return marcadasRepository.getMarcadas(userId, oposicionId ? Number(oposicionId) : null);
  },
};
