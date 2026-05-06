import { profesorSimulacrosRepository } from '../repositories/profesorSimulacros.repository.js';
import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { ApiError } from '../utils/api-error.js';

export const profesorSimulacrosService = {
  // ─── B7: Tests propios ────────────────────────────────────────────────────────
  async getMisTests(userId, { oposicionId, q, page, pageSize }) {
    return profesorSimulacrosRepository.getMisTests(userId, {
      oposicionId: oposicionId ?? null,
      q: q ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  // ─── B8: Simulacros propios ───────────────────────────────────────────────────
  async getMisSimulacros(userId, { oposicionId, estado, q, page, pageSize }) {
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
    // El profesor solo puede ver simulacros propios o de sus oposiciones asignadas
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No tienes acceso a este simulacro');
    return data;
  },

  async createSimulacro(userId, fields) {
    // Verificar que la oposición está asignada al profesor (si se especifica)
    if (fields.oposicion_id) {
      const asignada = await profesorSimulacrosRepository.oposicionAsignada(userId, fields.oposicion_id);
      if (!asignada) throw new ApiError(403, 'No tienes asignada esa oposición');
    }
    return adminSimulacrosRepository.createSimulacro(fields, userId);
  },

  async updateSimulacro(userId, simulacroId, fields) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No puedes editar este simulacro');
    // Si cambia oposicion_id, verificar que también está asignada
    if (fields.oposicion_id) {
      const asignada = await profesorSimulacrosRepository.oposicionAsignada(userId, fields.oposicion_id);
      if (!asignada) throw new ApiError(403, 'No tienes asignada esa oposición');
    }
    const data = await adminSimulacrosRepository.updateSimulacro(simulacroId, fields);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async deleteSimulacro(userId, simulacroId) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No puedes eliminar este simulacro');
    const data = await adminSimulacrosRepository.deleteSimulacro(simulacroId);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  // ─── Bloques (reutiliza repo de admin con guardia de propiedad) ───────────────
  async createBloque(userId, simulacroId, nombre, orden) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No tienes acceso a este simulacro');
    return adminSimulacrosRepository.createBloque(simulacroId, nombre, orden ?? 0);
  },

  async updateBloque(userId, simulacroId, bloqueId, fields) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No tienes acceso a este simulacro');
    const data = await adminSimulacrosRepository.updateBloque(bloqueId, fields);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async deleteBloque(userId, simulacroId, bloqueId) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No tienes acceso a este simulacro');
    const data = await adminSimulacrosRepository.deleteBloque(bloqueId);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async asignarPreguntas(userId, simulacroId, bloqueId, preguntaIds) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No tienes acceso a este simulacro');
    return adminSimulacrosRepository.asignarPreguntas(bloqueId, preguntaIds);
  },

  async quitarPregunta(userId, simulacroId, bloqueId, preguntaId) {
    const esPropio = await profesorSimulacrosRepository.simulacroEsPropio(userId, simulacroId);
    if (!esPropio) throw new ApiError(403, 'No tienes acceso a este simulacro');
    const data = await adminSimulacrosRepository.quitarPregunta(bloqueId, preguntaId);
    if (!data) throw new ApiError(404, 'Asignación no encontrada');
    return data;
  },
};
