import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';

const isProfesor = (caller = {}) => caller.role === 'profesor';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const adminSimulacrosService = {
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

  async assertPreguntasAllowed(preguntaIds, oposicionId, allowedIds) {
    if (!allowedIds) return;
    this.assertOposicionAllowed(oposicionId, allowedIds);
    const preguntaOposicionIds = await profesorAccessRepository.getPreguntaOposicionIds(preguntaIds);
    if (preguntaOposicionIds.length !== 1 || preguntaOposicionIds[0] !== Number(oposicionId)) {
      throw new ApiError(403, 'Solo puedes asignar preguntas de tus oposiciones asignadas');
    }
  },

  async assertExistingPreguntasMatchOposicion(simulacroId, oposicionId) {
    const preguntaIds = await adminSimulacrosRepository.getSimulacroPreguntaIds(simulacroId);
    if (preguntaIds.length === 0) return;
    const preguntaOposicionIds = await profesorAccessRepository.getPreguntaOposicionIds(preguntaIds);
    if (preguntaOposicionIds.length !== 1 || preguntaOposicionIds[0] !== Number(oposicionId)) {
      throw new ApiError(400, 'No puedes cambiar la oposicion mientras el simulacro contiene preguntas de otra oposicion');
    }
  },

  async assertBloqueBelongsToSimulacro(simulacroId, bloqueId) {
    const belongs = await adminSimulacrosRepository.bloqueBelongsToSimulacro(simulacroId, bloqueId);
    if (!belongs) throw new ApiError(404, 'Bloque no encontrado en este simulacro');
  },

  async listSimulacros({ q, estado, oposicionId, scope, page, pageSize }, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    if (allowedOposicionIds && oposicionId) this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    return adminSimulacrosRepository.listSimulacros({
      q: q ?? null,
      estado: estado ?? null,
      oposicionId: oposicionId ?? null,
      allowedOposicionIds,
      scope: scope ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getSimulacro(id, caller = {}) {
    const data = await adminSimulacrosRepository.getSimulacro(id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(data.oposicion_id, allowedOposicionIds);
    return data;
  },

  async createSimulacro(fields, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(fields.oposicion_id, allowedOposicionIds);
    return adminSimulacrosRepository.createSimulacro(fields, caller.userId);
  },

  async updateSimulacro(id, fields, caller = {}) {
    const current = await this.getSimulacro(id, caller);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    const oposicionId = hasOwn(fields, 'oposicion_id') ? fields.oposicion_id : current.oposicion_id;
    this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    await this.assertExistingPreguntasMatchOposicion(id, oposicionId);
    const data = await adminSimulacrosRepository.updateSimulacro(id, fields);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async deleteSimulacro(id) {
    const data = await adminSimulacrosRepository.deleteSimulacro(id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async createBloque(simulacroId, fields, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    return adminSimulacrosRepository.createBloque(simulacroId, fields);
  },

  async updateBloque(simulacroId, bloqueId, fields, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.updateBloque(bloqueId, fields);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async deleteBloque(simulacroId, bloqueId, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.deleteBloque(bloqueId);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async asignarPreguntas(simulacroId, bloqueId, preguntaIds, caller = {}) {
    const simulacro = await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    await this.assertPreguntasAllowed(preguntaIds, simulacro.oposicion_id, allowedOposicionIds);
    return adminSimulacrosRepository.asignarPreguntas(bloqueId, preguntaIds);
  },

  async quitarPregunta(simulacroId, bloqueId, preguntaId, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.quitarPregunta(bloqueId, preguntaId);
    if (!data) throw new ApiError(404, 'Asignacion no encontrada');
    return data;
  },
};
