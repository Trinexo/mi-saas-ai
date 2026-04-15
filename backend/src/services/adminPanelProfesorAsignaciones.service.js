import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { authRepository } from '../repositories/auth.repository.js';

export const adminPanelProfesorAsignacionesService = {
  /**
   * Lista las oposiciones asignadas a un profesor buscado por email.
   */
  async listAsignaciones(email) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');
    if (user.role !== 'profesor') throw new ApiError(400, 'El usuario no tiene rol de profesor');

    const asignaciones = await adminRepository.listByUserId(user.id);
    return { usuario: { id: user.id, nombre: user.nombre, email: user.email }, asignaciones };
  },

  /**
   * Asigna una oposición a un profesor buscado por email.
   */
  async assignOposicion(email, oposicionId) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');
    if (user.role !== 'profesor') throw new ApiError(400, 'El usuario no tiene rol de profesor');

    const row = await adminRepository.assign(user.id, oposicionId);
    // row null significa que ya estaba asignada (ON CONFLICT DO NOTHING)
    return { userId: user.id, oposicionId, yaExistia: row === null };
  },

  /**
   * Quita una oposición asignada a un profesor buscado por email.
   */
  async removeOposicion(email, oposicionId) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) throw new ApiError(404, 'Usuario no encontrado');
    if (user.role !== 'profesor') throw new ApiError(400, 'El usuario no tiene rol de profesor');

    const removed = await adminRepository.remove(user.id, oposicionId);
    if (!removed) throw new ApiError(404, 'Asignación no encontrada');
    return { userId: user.id, oposicionId };
  },
};
