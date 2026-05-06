import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { ApiError } from '../utils/api-error.js';

export const adminSimulacrosService = {
  async listSimulacros({ q, estado, oposicionId, page, pageSize }) {
    return adminSimulacrosRepository.listSimulacros({
      q: q ?? null,
      estado: estado ?? null,
      oposicionId: oposicionId ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getSimulacro(id) {
    const data = await adminSimulacrosRepository.getSimulacro(id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async createSimulacro(fields, creadoPor) {
    return adminSimulacrosRepository.createSimulacro(fields, creadoPor);
  },

  async updateSimulacro(id, fields) {
    const data = await adminSimulacrosRepository.updateSimulacro(id, fields);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async deleteSimulacro(id) {
    const data = await adminSimulacrosRepository.deleteSimulacro(id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  // ── Bloques ──────────────────────────────────────────────────────────────────
  async createBloque(simulacroId, nombre, orden) {
    // verificar que el simulacro existe
    const sim = await adminSimulacrosRepository.getSimulacro(simulacroId);
    if (!sim) throw new ApiError(404, 'Simulacro no encontrado');
    return adminSimulacrosRepository.createBloque(simulacroId, nombre, orden ?? 0);
  },

  async updateBloque(bloqueId, fields) {
    const data = await adminSimulacrosRepository.updateBloque(bloqueId, fields);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async deleteBloque(bloqueId) {
    const data = await adminSimulacrosRepository.deleteBloque(bloqueId);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  // ── Preguntas del bloque ─────────────────────────────────────────────────────
  async asignarPreguntas(bloqueId, preguntaIds) {
    return adminSimulacrosRepository.asignarPreguntas(bloqueId, preguntaIds);
  },

  async quitarPregunta(bloqueId, preguntaId) {
    const data = await adminSimulacrosRepository.quitarPregunta(bloqueId, preguntaId);
    if (!data) throw new ApiError(404, 'Asignación no encontrada');
    return data;
  },
};
