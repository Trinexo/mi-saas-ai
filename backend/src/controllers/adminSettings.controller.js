import nodemailer from 'nodemailer';
import { ok } from '../utils/response.js';
import { ApiError } from '../utils/api-error.js';
import { settingsService } from '../services/settings.service.js';

export const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getForAdmin();
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const updateEmailSettings = async (req, res, next) => {
  try {
    await settingsService.updateGrupo('email', req.body);
    return ok(res, null, 'Configuración de email guardada');
  } catch (error) {
    return next(error);
  }
};

export const updateStripeSettings = async (req, res, next) => {
  try {
    await settingsService.updateGrupo('stripe', req.body);
    return ok(res, null, 'Configuración de Stripe guardada');
  } catch (error) {
    return next(error);
  }
};

/**
 * Envía un email de prueba a la dirección indicada usando la
 * configuración activa (BD o .env) para verificar que SMTP funciona.
 */
export const testEmailSettings = async (req, res, next) => {
  try {
    const cfg = await settingsService.getEmailConfig();

    if (!cfg.host) {
      const err = new Error('No hay configuración SMTP. Guarda los ajustes primero.');
      err.status = 422;
      throw err;
    }

    const transporter = nodemailer.createTransport({
      host:   cfg.host,
      port:   cfg.port,
      secure: cfg.secure,
      auth:   { user: cfg.user, pass: cfg.pass },
      tls:    { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from:    cfg.from,
      to:      req.body.destinatario,
      subject: `[${cfg.appName}] Email de prueba`,
      text:    `Si recibes este mensaje, la configuración SMTP de ${cfg.appName} funciona correctamente.`,
    });

    return ok(res, null, 'Email de prueba enviado');
  } catch (error) {
    // Propagar ApiError tal cual (422 si no hay SMTP, etc.)
    if (error instanceof ApiError) return next(error);
    // Error de conexión SMTP → 502 con mensaje legible
    return next(new ApiError(502, `Error SMTP: ${error.message}`));
  }
};
