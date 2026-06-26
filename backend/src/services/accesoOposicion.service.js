import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
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
    return accesoOposicionRepository.getAccesosActivos(userId);
  },

  async getPreparacion(userId, oposicionId) {
    const acceso = await accesoOposicionRepository.getPreparacion(userId, oposicionId);
    if (!acceso) throw new ApiError(404, 'Acceso activo no encontrado para esta oposicion');
    return acceso;
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
