import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';

export const authAccessRegisterService = {
  async register(payload) {
    const exists = await authRepository.getUserByEmail(payload.email);
    if (exists) {
      throw new ApiError(409, 'El email ya esta registrado');
    }
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await authRepository.createUser({
      nombre: payload.nombre,
      email: payload.email,
      passwordHash,
    });
    return { id: user.id, nombre: user.nombre, email: user.email, role: user.role };
  },
};
