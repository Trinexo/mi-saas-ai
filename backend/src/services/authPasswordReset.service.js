import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/api-error.js';
import { authRepository } from '../repositories/auth.repository.js';
import { emailService } from './email.service.js';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

export const authPasswordResetService = {
  /**
   * Solicita un reset de contraseña: genera token, guarda hash, envía email.
   * Siempre responde con éxito para no exponer si el email existe.
   */
  async forgotPassword({ email }) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) return; // silencioso — no revelar si el email existe

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await authRepository.createPasswordReset({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Fire-and-forget: si falla el email no bloqueamos la respuesta
    emailService.sendPasswordReset({ to: user.email, nombre: user.nombre, token }).catch(
      (err) => console.error('[email] Error enviando reset password:', err.message),
    );
  },

  /**
   * Verifica el token y actualiza la contraseña.
   */
  async resetPassword({ token, passwordNuevo }) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await authRepository.getPasswordReset(tokenHash);

    if (!reset) {
      throw new ApiError(400, 'Token inválido o expirado');
    }
    if (reset.usado_en) {
      throw new ApiError(400, 'Este enlace ya ha sido utilizado');
    }
    if (new Date(reset.expires_at) < new Date()) {
      throw new ApiError(400, 'El enlace ha expirado. Solicita uno nuevo');
    }

    const passwordHash = await bcrypt.hash(passwordNuevo, 10);
    await authRepository.updatePasswordHash(reset.usuario_id, passwordHash);
    await authRepository.markPasswordResetUsed(reset.id);
  },
};
