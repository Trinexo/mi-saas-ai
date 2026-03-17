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

  async getMarcadas(userId) {
    return marcadasRepository.getMarcadas(userId);
  },
};
