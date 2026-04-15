import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';
import { emailService } from './email.service.js';

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

    // Email de bienvenida (fire-and-forget — no bloquea el registro)
    emailService.sendWelcome({ to: user.email, nombre: user.nombre }).catch(
      (err) => console.error('[email] Error enviando bienvenida:', err.message),
    );

    return { id: user.id, nombre: user.nombre, email: user.email, role: user.role };
  },
};
