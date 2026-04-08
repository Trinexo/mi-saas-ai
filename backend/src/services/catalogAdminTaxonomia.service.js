import { catalogAdminRepository } from '../repositories/catalogAdmin.repository.js';
import { ApiError } from '../utils/api-error.js';

export const catalogAdminTaxonomiaService = {
  async createMateria(oposicionId, nombre) {
    return catalogAdminRepository.createMateria(oposicionId, nombre);
  },

  async updateMateria(id, nombre) {
    const result = await catalogAdminRepository.updateMateria(id, nombre);
    if (!result) throw new ApiError(404, 'Materia no encontrada');
    return result;
  },

  async deleteMateria(id) {
    const result = await catalogAdminRepository.deleteMateria(id);
    if (!result) throw new ApiError(404, 'Materia no encontrada');
    return result;
  },

  async createTema(materiaId, nombre) {
    return catalogAdminRepository.createTema(materiaId, nombre);
  },

  async updateTema(id, nombre) {
    const result = await catalogAdminRepository.updateTema(id, nombre);
    if (!result) throw new ApiError(404, 'Tema no encontrado');
    return result;
  },

  async deleteTema(id) {
    const result = await catalogAdminRepository.deleteTema(id);
    if (!result) throw new ApiError(404, 'Tema no encontrado');
    return result;
  },
};
