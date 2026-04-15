import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';

export const authProfileWriteService = {
  async updateProfile(userId, fields) {
    if (fields.email) {
      const existing = await authRepository.getUserByEmail(fields.email);
      if (existing && String(existing.id) !== String(userId)) {
        throw new ApiError(409, 'El email ya esta en uso');
      }
    }
    const updated = await authRepository.updateProfile(userId, fields);
    if (!updated) throw new ApiError(404, 'Usuario no encontrado');
    return {
      id: updated.id,
      nombre: updated.nombre,
      email: updated.email,
      role: updated.role,
      oposicionPreferidaId: updated.oposicion_preferida_id ?? null,
      objetivoDiarioPreguntas: updated.objetivo_diario_preguntas ?? 10,
    };
  },

  async updatePassword(userId, { passwordActual, passwordNuevo }) {
    const hash = await authRepository.getPasswordHash(userId);
    if (!hash) throw new ApiError(404, 'Usuario no encontrado');
    const valid = await bcrypt.compare(passwordActual, hash);
    if (!valid) throw new ApiError(401, 'La contrasena actual es incorrecta');
    const newHash = await bcrypt.hash(passwordNuevo, 10);
    await authRepository.updatePasswordHash(userId, newHash);
  },
};