import { albacerModulosRepository } from '../repositories/albacerModulos.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { adminTestsService } from './adminTests.service.js';
import { adminSimulacrosService } from './adminSimulacros.service.js';
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

  assertSameOposicion(contentOposicionId, moduloOposicionId) {
    if (Number(contentOposicionId) !== Number(moduloOposicionId)) {
      throw new ApiError(400, 'El contenido debe pertenecer a la misma oposicion que el modulo');
    }
  },

  async listItems(moduloId, caller = {}) {
    await this.get(moduloId, caller);
    return albacerModulosRepository.listItems(moduloId);
  },

  async createItem(moduloId, payload, caller = {}) {
    const modulo = await this.get(moduloId, caller);

    if (payload.tipo === 'test') {
      const test = await adminTestsService.getTest(payload.plantilla_test_id, caller);
      this.assertSameOposicion(test.oposicion_id ?? test.resolved_oposicion_id, modulo.oposicion_id);
      const orden = payload.orden ?? await albacerModulosRepository.getNextItemOrden(moduloId);
      const item = await albacerModulosRepository.createItem(moduloId, {
        ...payload,
        simulacro_id: null,
        orden,
        obligatorio: payload.obligatorio ?? false,
      });
      await albacerModulosRepository.markTestAsModulo(payload.plantilla_test_id, moduloId);
      return this.getItem(item.id, caller);
    }

    const hasFinal = await albacerModulosRepository.hasSimulacroFinal(moduloId);
    if (hasFinal) throw new ApiError(400, 'El modulo ya tiene un simulacro final');
    const simulacro = await adminSimulacrosService.getSimulacro(payload.simulacro_id, caller);
    this.assertSameOposicion(simulacro.oposicion_id, modulo.oposicion_id);
    const orden = payload.orden ?? await albacerModulosRepository.getNextItemOrden(moduloId);
    const item = await albacerModulosRepository.createItem(moduloId, {
      ...payload,
      plantilla_test_id: null,
      orden,
      obligatorio: true,
    });
    await albacerModulosRepository.markSimulacroAsModuloFinal(payload.simulacro_id, moduloId);
    return this.getItem(item.id, caller);
  },

  async getItem(itemId, caller = {}) {
    const item = await albacerModulosRepository.getItem(itemId);
    if (!item) throw new ApiError(404, 'Item del modulo no encontrado');
    await this.get(item.modulo_id, caller);
    const items = await albacerModulosRepository.listItems(item.modulo_id);
    return items.find((candidate) => candidate.id === Number(itemId)) ?? item;
  },

  async updateItem(moduloId, itemId, payload, caller = {}) {
    await this.get(moduloId, caller);
    const item = await albacerModulosRepository.getItem(itemId);
    if (!item || Number(item.modulo_id) !== Number(moduloId)) {
      throw new ApiError(404, 'Item del modulo no encontrado');
    }
    const updated = await albacerModulosRepository.updateItem(itemId, payload);
    if (!updated) throw new ApiError(500, 'No se pudo actualizar el item del modulo');
    return this.getItem(itemId, caller);
  },

  async deleteItem(moduloId, itemId, caller = {}) {
    await this.get(moduloId, caller);
    const item = await albacerModulosRepository.getItem(itemId);
    if (!item || Number(item.modulo_id) !== Number(moduloId)) {
      throw new ApiError(404, 'Item del modulo no encontrado');
    }
    const deleted = await albacerModulosRepository.deleteItem(itemId);
    if (!deleted) throw new ApiError(404, 'Item del modulo no encontrado');
    if (deleted.plantilla_test_id) {
      await albacerModulosRepository.unmarkTestAsModulo(deleted.plantilla_test_id, moduloId);
    }
    if (deleted.simulacro_id) {
      await albacerModulosRepository.unmarkSimulacroAsModuloFinal(deleted.simulacro_id, moduloId);
    }
  },
};
