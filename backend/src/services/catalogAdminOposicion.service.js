import { catalogAdminRepository } from '../repositories/catalogAdmin.repository.js';
import { ApiError } from '../utils/api-error.js';

export const catalogAdminOposicionService = {
  async listOposicionesConStats({ q, estado, categoria, page, pageSize }) {
    const limit  = pageSize;
    const offset = (page - 1) * pageSize;
    return catalogAdminRepository.listOposicionesConStats({ q, estado, categoria, limit, offset });
  },

  async createOposicion(nombre, descripcion) {
    return catalogAdminRepository.createOposicion(nombre, descripcion);
  },

  async updateOposicion(id, fields) {
    const result = await catalogAdminRepository.updateOposicion(id, fields);
    if (!result) throw new ApiError(404, 'Oposición no encontrada');
    return result;
  },

  async deleteOposicion(id) {
    const result = await catalogAdminRepository.deleteOposicion(id);
    if (!result) throw new ApiError(404, 'Oposición no encontrada');
    return result;
  },
};
