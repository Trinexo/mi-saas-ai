import { albacerModulosRepository } from '../repositories/albacerModulos.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';

const isProfesor = (caller = {}) => caller.role === 'profesor';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const uniqTemaIds = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0),
  )];
};

export const albacerModulosService = {
  async getAllowedOposicionIds(caller = {}) {
    if (!isProfesor(caller)) return null;
    const ids = await profesorAccessRepository.listAssignedOposicionIds(caller.userId);
    if (ids.length === 0) throw new ApiError(403, 'No tienes oposiciones asignadas');
    return ids;
  },

  assertOposicionAllowed(oposicionId, allowedIds) {
    if (!allowedIds) return;
    if (!oposicionId || !allowedIds.includes(Number(oposicionId))) {
      throw new ApiError(403, 'No tienes asignada esa oposicion');
    }
  },

  async assertTemasMatchOposicion(oposicionId, temaIds) {
    if (!temaIds.length) return;
    const total = await albacerModulosRepository.countTemasInOposicion(oposicionId, temaIds);
    if (total !== temaIds.length) {
      throw new ApiError(400, 'Todos los temas del modulo deben pertenecer a la oposicion seleccionada');
    }
  },

  async list({ q, estado, oposicionId, page, pageSize }, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    if (allowedOposicionIds && oposicionId) this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    return albacerModulosRepository.list({
      q,
      estado,
      oposicionId,
      allowedOposicionIds,
      limit,
      offset,
    });
  },

  async get(id, caller = {}) {
    const modulo = await albacerModulosRepository.get(id);
    if (!modulo) throw new ApiError(404, 'Modulo Albacer no encontrado');
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(modulo.oposicion_id, allowedOposicionIds);
    return modulo;
  },

  async create(payload, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(payload.oposicion_id, allowedOposicionIds);
    const temaIds = uniqTemaIds(payload.tema_ids);
    await this.assertTemasMatchOposicion(payload.oposicion_id, temaIds);
    const modulo = await albacerModulosRepository.create(payload, caller);
    await albacerModulosRepository.replaceTemas(modulo.id, temaIds);
    return this.get(modulo.id, caller);
  },

  async update(id, payload, caller = {}) {
    const current = await this.get(id, caller);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    const oposicionId = hasOwn(payload, 'oposicion_id')
      ? payload.oposicion_id
      : current.oposicion_id;
    this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    const temaIds = hasOwn(payload, 'tema_ids')
      ? uniqTemaIds(payload.tema_ids)
      : current.tema_ids;
    await this.assertTemasMatchOposicion(oposicionId, temaIds);

    const updated = await albacerModulosRepository.update(id, payload);
    if (!updated) throw new ApiError(500, 'No se pudo actualizar el modulo Albacer');
    if (hasOwn(payload, 'tema_ids')) {
      await albacerModulosRepository.replaceTemas(id, temaIds);
    }
    return this.get(id, caller);
  },

  async delete(id, caller = {}) {
    await this.get(id, caller);
    const deleted = await albacerModulosRepository.delete(id);
    if (!deleted) throw new ApiError(404, 'Modulo Albacer no encontrado');
  },
};
