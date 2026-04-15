import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudWriteEstadoService = {
  async updatePreguntaEstado(preguntaId, estado, requestingUser) {
    const allowed = ['revisor', 'admin'];
    if (!allowed.includes(requestingUser.role)) {
      throw new ApiError(403, 'Solo revisores y admins pueden cambiar el estado de preguntas');
    }
    const updated = await adminRepository.updatePreguntaEstado(preguntaId, estado);
    if (!updated) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    return updated;
  },
};