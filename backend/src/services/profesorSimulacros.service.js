import { profesorSimulacrosRepository } from '../repositories/profesorSimulacros.repository.js';
import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const profesorSimulacrosService = {
  async assertOposicionAsignada(userId, oposicionId) {
    if (!oposicionId) throw new ApiError(400, 'Debes seleccionar una oposicion asignada');
    const asignada = await profesorAccessRepository.hasAssignedOposicion(userId, oposicionId);
    if (!asignada) throw new ApiError(403, 'No tienes asignada esa oposicion');
  },

  async assertPreguntasDeOposicion(preguntaIds, oposicionId) {
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

  async getMisTests(userId, { oposicionId, q, scope, page, pageSize }) {
    if (oposicionId) await this.assertOposicionAsignada(userId, oposicionId);
    return profesorSimulacrosRepository.getMisTests(userId, {
      oposicionId: oposicionId ?? null,
      q: q ?? null,
      scope: scope ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getMisSimulacros(userId, { oposicionId, estado, q, page, pageSize }) {
    if (oposicionId) await this.assertOposicionAsignada(userId, oposicionId);
    return profesorSimulacrosRepository.getMisSimulacros(userId, {
      oposicionId: oposicionId ?? null,
      estado: estado ?? null,
      q: q ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getSimulacro(userId, simulacroId) {
    const data = await adminSimulacrosRepository.getSimulacro(simulacroId);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No tienes acceso a este simulacro');
    await this.assertOposicionAsignada(userId, data.oposicion_id);
    return data;
  },

  async createSimulacro(userId, fields) {
    await this.assertOposicionAsignada(userId, fields.oposicion_id);
    return adminSimulacrosRepository.createSimulacro(fields, userId);
  },

  async updateSimulacro(userId, simulacroId, fields) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No puedes editar este simulacro');
    const current = await adminSimulacrosRepository.getSimulacro(simulacroId);
    if (!current) throw new ApiError(404, 'Simulacro no encontrado');
    const oposicionId = hasOwn(fields, 'oposicion_id') ? fields.oposicion_id : current.oposicion_id;
    await this.assertOposicionAsignada(userId, oposicionId);
    await this.assertExistingPreguntasMatchOposicion(simulacroId, oposicionId);
    const data = await adminSimulacrosRepository.updateSimulacro(simulacroId, fields);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async deleteSimulacro(userId, simulacroId) {
    const current = await this.getSimulacro(userId, simulacroId);
    const data = await adminSimulacrosRepository.deleteSimulacro(current.id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async createBloque(userId, simulacroId, fields) {
    await this.getSimulacro(userId, simulacroId);
    return adminSimulacrosRepository.createBloque(simulacroId, {
      nombre: fields.nombre,
      orden: fields.orden ?? 0,
      numero_preguntas: fields.numero_preguntas ?? 0,
    });
  },

  async updateBloque(userId, simulacroId, bloqueId, fields) {
    await this.getSimulacro(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.updateBloque(bloqueId, fields);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async deleteBloque(userId, simulacroId, bloqueId) {
    await this.getSimulacro(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.deleteBloque(bloqueId);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async asignarPreguntas(userId, simulacroId, bloqueId, preguntaIds) {
    const simulacro = await this.getSimulacro(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    await this.assertPreguntasDeOposicion(preguntaIds, simulacro.oposicion_id);
    return adminSimulacrosRepository.asignarPreguntas(bloqueId, preguntaIds);
  },

  async quitarPregunta(userId, simulacroId, bloqueId, preguntaId) {
    await this.getSimulacro(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.quitarPregunta(bloqueId, preguntaId);
    if (!data) throw new ApiError(404, 'Asignacion no encontrada');
    return data;
  },
};
