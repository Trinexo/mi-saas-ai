import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';

export const authService = {
  async register(payload) {
    const exists = await authRepository.getUserByEmail(payload.email);
    if (exists) {
      throw new ApiError(409, 'El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await authRepository.createUser({
      nombre: payload.nombre,
      email: payload.email,
      passwordHash,
    });

    return {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
    };
  },

  async login(payload) {
    const user = await authRepository.getUserByEmail(payload.email);
    if (!user) {
      throw new ApiError(401, 'Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(payload.password, user.password_hash);
    if (!validPassword) {
      throw new ApiError(401, 'Credenciales inválidas');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
      },
    };
  },
};