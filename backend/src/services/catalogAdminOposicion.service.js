import { catalogAdminRepository } from '../repositories/catalogAdmin.repository.js';
import { ApiError } from '../utils/api-error.js';

export const catalogAdminOposicionService = {
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
