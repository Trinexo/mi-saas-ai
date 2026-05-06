import { adminEtiquetasRepository } from '../repositories/adminEtiquetas.repository.js';
import { ApiError } from '../utils/api-error.js';

export const adminEtiquetasService = {
  async listEtiquetas({ q, page, pageSize }) {
    return adminEtiquetasRepository.listEtiquetas({
      q: q ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getEtiqueta(id) {
    const data = await adminEtiquetasRepository.getEtiqueta(id);
    if (!data) throw new ApiError(404, 'Etiqueta no encontrada');
    return data;
  },

  async createEtiqueta(fields, creadoPor) {
    return adminEtiquetasRepository.createEtiqueta(
      fields.nombre,
      fields.color ?? null,
      fields.descripcion ?? null,
      creadoPor,
    );
  },

  async updateEtiqueta(id, fields) {
    const data = await adminEtiquetasRepository.updateEtiqueta(id, fields);
    if (!data) throw new ApiError(404, 'Etiqueta no encontrada');
    return data;
  },

  async deleteEtiqueta(id) {
    const data = await adminEtiquetasRepository.deleteEtiqueta(id);
    if (!data) throw new ApiError(404, 'Etiqueta no encontrada');
    return data;
  },

  async setEtiquetasDePregunta(preguntaId, etiquetaIds) {
    return adminEtiquetasRepository.setEtiquetasDePregunta(preguntaId, etiquetaIds);
  },

  async getEtiquetasDePregunta(preguntaId) {
    return adminEtiquetasRepository.getEtiquetasDePregunta(preguntaId);
  },
};
