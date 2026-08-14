import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { accessContextService } from './accessContext.service.js';
import { ApiError } from '../utils/api-error.js';

const MODOS_PREPARACION = ['experto', 'albacer'];
const TIPOS_ALUMNO = ['libre', 'albacer'];

const assertModoPreparacion = (modo) => {
  if (!MODOS_PREPARACION.includes(modo)) {
    throw new ApiError(400, `Modo invalido. Valores permitidos: ${MODOS_PREPARACION.join(', ')}`);
  }
};

const assertTipoAlumno = (tipo) => {
  if (!TIPOS_ALUMNO.includes(tipo)) {
    throw new ApiError(400, `Tipo de alumno invalido. Valores permitidos: ${TIPOS_ALUMNO.join(', ')}`);
  }
};

export const accesoOposicionService = {
  async getMisAccesos(userId) {
    const contextos = await accessContextService.obtenerContextosUsuarioConLegacy({ usuarioId: userId });
    return contextos
      .filter(({ contexto }) => {
        if (contexto.permisos.puede_acceder_contenido) return true;
        if (contexto.estado_efectivo !== 'pendiente_modo') return false;
        const inicio = new Date(contexto.vigencia.fecha_inicio).getTime();
        const fin = contexto.vigencia.fecha_fin === null
          ? Infinity
          : new Date(contexto.vigencia.fecha_fin).getTime();
        const ahora = Date.now();
        return Number.isFinite(inicio) && inicio <= ahora && fin > ahora;
      })
      .map(({ contexto, legacy }) => {
        return {
          oposicion_id: contexto.oposicion_id,
          nombre: legacy?.nombre ?? null,
          fecha_fin: contexto.vigencia.fecha_fin,
          tipo_alumno: legacy?.tipo_alumno ?? null,
          estado: contexto.estado,
          estado_efectivo: contexto.estado_efectivo,
          modo_activo: contexto.modo_activo,
          modelos_disponibles: contexto.modelos_disponibles,
          modo_preparacion: contexto.modo_activo === null
            ? null
            : (contexto.modo_activo === 'guiado' ? 'albacer' : 'experto'),
          ranking_publico: legacy?.ranking_publico ?? false,
        };
      });
  },

  async getPreparacion(userId, oposicionId) {
    const contexto = await accessContextService.obtenerContextoUsuario({ usuarioId: userId, oposicionId });
    if (!contexto.permisos.puede_acceder_contenido) {
      throw new ApiError(404, 'Acceso activo no encontrado para esta oposicion');
    }
    const acceso = await accesoOposicionRepository.obtenerDatosLegacyAcceso(userId, contexto.oposicion_id);
    if (!acceso) throw new ApiError(404, 'Acceso activo no encontrado para esta oposicion');
    return {
      usuario_id: contexto.usuario_id,
      oposicion_id: contexto.oposicion_id,
      nombre: acceso.nombre,
      tipo_alumno: acceso.tipo_alumno,
      modo_preparacion: contexto.modo_activo === 'guiado' ? 'albacer' : 'experto',
      ranking_publico: acceso.ranking_publico,
    };
  },

  async updateModoPreparacion(userId, oposicionId, modoPreparacion) {
    assertModoPreparacion(modoPreparacion);
    const acceso = await accesoOposicionRepository.updatePreparacion(userId, oposicionId, { modoPreparacion });
    if (!acceso) throw new ApiError(404, 'Acceso activo no encontrado para esta oposicion');
    return acceso;
  },

  async updatePreparacion(userId, oposicionId, { modoPreparacion, rankingPublico } = {}) {
    if (modoPreparacion != null) assertModoPreparacion(modoPreparacion);
    const acceso = await accesoOposicionRepository.updatePreparacion(userId, oposicionId, {
      modoPreparacion: modoPreparacion ?? null,
      rankingPublico: rankingPublico ?? null,
    });
    if (!acceso) throw new ApiError(404, 'Acceso activo no encontrado para esta oposicion');
    return acceso;
  },

  async tieneAcceso(userId, oposicionId) {
    return accesoOposicionRepository.tieneAcceso(userId, oposicionId);
  },

  async asignarAcceso({ userId, oposicionId, fechaFin, precioPagado, notas, tipoAlumno, modoPreparacion }) {
    const resolvedTipoAlumno = tipoAlumno ?? 'libre';
    const resolvedModoPreparacion = modoPreparacion ?? 'albacer';
    assertTipoAlumno(resolvedTipoAlumno);
    assertModoPreparacion(resolvedModoPreparacion);
    return accesoOposicionRepository.crearAcceso({
      userId,
      oposicionId,
      fechaFin,
      precioPagado,
      notas,
      tipoAlumno: resolvedTipoAlumno,
      modoPreparacion: resolvedModoPreparacion,
    });
  },

  async cancelarAcceso(userId, oposicionId) {
    return accesoOposicionRepository.cancelarAcceso(userId, oposicionId);
  },

  async updateAcceso(userId, oposicionId, updates) {
    if (updates.tipoAlumno != null) assertTipoAlumno(updates.tipoAlumno);
    if (updates.modoPreparacion != null) assertModoPreparacion(updates.modoPreparacion);
    return accesoOposicionRepository.updateAcceso(userId, oposicionId, updates);
  },

  async listAll(filters) {
    return accesoOposicionRepository.listAll(filters);
  },

  async getStats() {
    return accesoOposicionRepository.getStats();
  },

  async getUserByEmail(email) {
    return accesoOposicionRepository.getUserByEmail(email);
  },
};
