import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';

export const authService = {
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
