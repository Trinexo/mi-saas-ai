import { notificacionesRepository } from '../repositories/notificaciones.repository.js';

export const notificacionesService = {
  async list({ usuarioId, page, pageSize, soloNoLeidas }) {
    const offset = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      notificacionesRepository.listByUsuario({ usuarioId, soloNoLeidas, limit: pageSize, offset }),
      notificacionesRepository.countByUsuario({ usuarioId, soloNoLeidas }),
    ]);

    return { items, pagination: { page, pageSize, total } };
  },

  async countNoLeidas(usuarioId) {
    return notificacionesRepository.countByUsuario({ usuarioId, soloNoLeidas: true });
  },

  async marcarLeida(notificacionId, usuarioId) {
    return notificacionesRepository.marcarLeida(notificacionId, usuarioId);
  },

  async marcarTodasLeidas(usuarioId) {
    return notificacionesRepository.marcarTodasLeidas(usuarioId);
  },

  async crearNotificacionReporte({ usuarioId, reporteId, preguntaEnunciado, nuevoEstado, mensajeAdmin }) {
    const estados = {
      resuelto:   { titulo: 'Reporte resuelto',   emoji: '✅' },
      descartado: { titulo: 'Reporte descartado', emoji: '⚠️' },
    };

    const { titulo, emoji } = estados[nuevoEstado] ?? { titulo: 'Reporte actualizado', emoji: '📋' };
    const enunciadoCorto = preguntaEnunciado?.length > 80
      ? preguntaEnunciado.slice(0, 80) + '…'
      : preguntaEnunciado;

    const mensajes = {
      resuelto:   `Tu reporte sobre la pregunta "${enunciadoCorto}" ha sido revisado y marcado como resuelto. Gracias por tu colaboración.`,
      descartado: `Tu reporte sobre la pregunta "${enunciadoCorto}" ha sido revisado y descartado por el equipo de administración.`,
    };

    await notificacionesRepository.crear({
      usuarioId,
      tipo: 'reporte_actualizado',
      titulo: `${emoji} ${titulo}`,
      mensaje: mensajes[nuevoEstado] ?? 'El estado de tu reporte ha sido actualizado.',
      datosExtra: { reporteId, nuevoEstado, mensajeAdmin: mensajeAdmin || null },
    });
  },
};
