import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';

export const authProfileReadService = {
  async getMe(userId) {
    const user = await authRepository.getUserById(userId);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');
    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
      oposicionPreferidaId: user.oposicion_preferida_id ?? null,
      objetivoDiarioPreguntas: user.objetivo_diario_preguntas ?? 10,
      fechaRegistro: user.fecha_registro,
    };
  },
};