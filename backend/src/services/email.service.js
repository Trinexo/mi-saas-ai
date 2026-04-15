import nodemailer from 'nodemailer';
import { settingsService } from './settings.service.js';

/**
 * Crea el transporter de Nodemailer leyendo config de BD (con fallback a .env).
 * Se crea uno nuevo por llamada para reflejar cambios de configuración en caliente.
 */
async function getTransporter() {
  const cfg = await settingsService.getEmailConfig();

  if (cfg.host) {
    return {
      transport: nodemailer.createTransport({
        host:   cfg.host,
        port:   cfg.port,
        secure: cfg.secure,
        auth:   { user: cfg.user, pass: cfg.pass },
        tls:    { rejectUnauthorized: false },
      }),
      from:    cfg.from,
      appName: cfg.appName,
    };
  }

  // Sin SMTP configurado → Ethereal para desarrollo
  const testAccount = await nodemailer.createTestAccount();
  console.log('[email] Sin SMTP. Usando Ethereal. Usuario:', testAccount.user);
  return {
    transport: nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    }),
    from:    cfg.from,
    appName: cfg.appName,
  };
}

export const emailService = {
  /**
   * Email de bienvenida al registrarse.
   */
  async sendWelcome({ to, nombre }) {
    const { transport, from, appName } = await getTransporter();
    const info = await transport.sendMail({
      from,
      replyTo: from,
      to,
      subject: `¡Bienvenido/a a ${appName}, ${nombre}!`,
      html: buildWelcomeHtml({ nombre, appName }),
      text: `Hola ${nombre}, tu cuenta en ${appName} ha sido creada correctamente.`,
    });
    if (process.env.NODE_ENV !== 'production') {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('[email] Preview bienvenida:', preview);
    }
  },

  /**
   * Email de confirmación de acceso a una oposición (tras pago con Stripe).
   */
  async sendAccesoConfirmado({ to, nombre, oposicionNombre, fechaFin }) {
    const { transport, from, appName } = await getTransporter();
    const info = await transport.sendMail({
      from,
      replyTo: from,
      to,
      subject: `Acceso confirmado: ${oposicionNombre} — ${appName}`,
      html: buildAccesoConfirmadoHtml({ nombre, oposicionNombre, fechaFin, appName }),
      text: `Hola ${nombre}, tu acceso a "${oposicionNombre}" ha sido activado correctamente${fechaFin ? ` hasta el ${new Date(fechaFin).toLocaleDateString('es-ES')}` : ''}.`,
    });
    if (process.env.NODE_ENV !== 'production') {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('[email] Preview acceso confirmado:', preview);
    }
  },

  /**
   * Email de confirmación al asignar un plan (Pro / Elite) manualmente desde el panel admin.
   */
  async sendSuscripcionConfirmada({ to, nombre, plan, fechaFin }) {
    const { transport, from, appName } = await getTransporter();
    const info = await transport.sendMail({
      from,
      replyTo: from,
      to,
      subject: `Plan ${plan} activado — ${appName}`,
      html: buildSuscripcionConfirmadaHtml({ nombre, plan, fechaFin, appName }),
      text: `Hola ${nombre}, tu plan ${plan} en ${appName} ha sido activado${fechaFin ? ` hasta el ${new Date(fechaFin).toLocaleDateString('es-ES')}` : ''}.`,
    });
    if (process.env.NODE_ENV !== 'production') {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('[email] Preview suscripción confirmada:', preview);
    }
  },

  /**
   * Email con link de recuperación de contraseña.
   * token: el token en claro (no el hash)
   */
  async sendPasswordReset({ to, nombre, token }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const { transport, from, appName } = await getTransporter();
    const info = await transport.sendMail({
      from,
      replyTo: from,
      to,
      subject: `Recupera tu contraseña — ${appName}`,
      html: buildPasswordResetHtml({ nombre, resetUrl, appName }),
      text: `Hola ${nombre}, usa este enlace para resetear tu contraseña (válido 1 hora): ${resetUrl}`,
    });
    if (process.env.NODE_ENV !== 'production') {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('[email] Preview reset password:', preview);
    }
  },
};

// ─── Templates HTML ──────────────────────────────────────────────────────────

function baseLayout(content, appName) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <tr><td style="background:#1d4ed8;padding:24px 32px">
          <p style="margin:0;font-size:1.25rem;font-weight:700;color:#fff">${appName}</p>
        </td></tr>
        <tr><td style="padding:32px">
          ${content}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
          <p style="margin:0;font-size:0.75rem;color:#9ca3af;text-align:center">
            Si no solicitaste este email, puedes ignorarlo.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildWelcomeHtml({ nombre, appName }) {
  const content = `
    <h2 style="margin:0 0 12px;font-size:1.375rem;color:#111827">¡Hola, ${nombre}!</h2>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6">
      Tu cuenta en <strong>${appName}</strong> ha sido creada correctamente.
      Ya puedes empezar a practicar con nuestro banco de preguntas.
    </p>
    <p style="margin:0;color:#6b7280;font-size:0.875rem">
      Si tienes cualquier duda, responde a este email y te ayudaremos encantados.
    </p>`;
  return baseLayout(content, appName);
}

function buildPasswordResetHtml({ nombre, resetUrl, appName }) {
  const content = `
    <h2 style="margin:0 0 12px;font-size:1.375rem;color:#111827">Recupera tu contraseña</h2>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6">
      Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
      Haz clic en el botón para crear una nueva (el enlace es válido durante <strong>1 hora</strong>):
    </p>
    <p style="margin:0 0 24px;text-align:center">
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 28px;background:#1d4ed8;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:0.95rem">
        Restablecer contraseña →
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:0.8rem">
      Si no solicitaste esto, puedes ignorar este email. Tu contraseña actual no cambiará.
    </p>`;
  return baseLayout(content, appName);
}

function buildAccesoConfirmadoHtml({ nombre, oposicionNombre, fechaFin, appName }) {
  const fechaTexto = fechaFin
    ? `hasta el <strong>${new Date(fechaFin).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>`
    : 'de forma indefinida';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const content = `
    <h2 style="margin:0 0 12px;font-size:1.375rem;color:#111827">✅ Acceso activado</h2>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6">
      Hola <strong>${nombre}</strong>, tu pago ha sido procesado correctamente.
      Ya tienes acceso a <strong>${oposicionNombre}</strong> ${fechaTexto}.
    </p>
    <p style="margin:0 0 24px;text-align:center">
      <a href="${frontendUrl}"
         style="display:inline-block;padding:12px 28px;background:#059669;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:0.95rem">
        Empezar a practicar →
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:0.8rem">
      Si tienes cualquier problema, responde a este email y te ayudaremos.
    </p>`;
  return baseLayout(content, appName);
}

function buildSuscripcionConfirmadaHtml({ nombre, plan, fechaFin, appName }) {
  const planLabel = plan === 'elite' ? '⭐ Elite' : plan === 'pro' ? '🚀 Pro' : plan;
  const fechaTexto = fechaFin
    ? `hasta el <strong>${new Date(fechaFin).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>`
    : 'sin fecha de caducidad';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const content = `
    <h2 style="margin:0 0 12px;font-size:1.375rem;color:#111827">🎉 Plan ${planLabel} activado</h2>
    <p style="margin:0 0 20px;color:#374151;line-height:1.6">
      Hola <strong>${nombre}</strong>, tu plan <strong>${planLabel}</strong> en ${appName} ha sido activado ${fechaTexto}.
      Ya puedes disfrutar de todas las funcionalidades incluidas.
    </p>
    <p style="margin:0 0 24px;text-align:center">
      <a href="${frontendUrl}"
         style="display:inline-block;padding:12px 28px;background:#1d4ed8;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;font-size:0.95rem">
        Ir a la plataforma →
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:0.8rem">
      Si tienes cualquier duda, responde a este email y te ayudaremos encantados.
    </p>`;
  return baseLayout(content, appName);
}
