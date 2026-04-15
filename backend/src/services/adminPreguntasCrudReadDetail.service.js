import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudReadDetailService = {
  async getPregunta(preguntaId) {
    const pregunta = await adminRepository.getFullPreguntaById(preguntaId);
    if (!pregunta) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    return pregunta;
  },

  async getPreguntasPorEstado() {
    return adminRepository.getPreguntasPorEstado();
  },
};