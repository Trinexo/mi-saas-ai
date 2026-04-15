import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';

export const authAccessLoginService = {
  async login(payload) {
    const user = await authRepository.getUserByEmail(payload.email);
    if (!user) throw new ApiError(401, 'Credenciales invalidas');
    const validPassword = await bcrypt.compare(payload.password, user.password_hash);
    if (!validPassword) throw new ApiError(401, 'Credenciales invalidas');
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    return { token, user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role } };
  },
};
