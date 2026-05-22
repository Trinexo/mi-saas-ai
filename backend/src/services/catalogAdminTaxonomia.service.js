import { catalogAdminRepository } from '../repositories/catalogAdmin.repository.js';
import { ApiError } from '../utils/api-error.js';

const isTemaPrimaryKeySequenceCollision = (error) => (
  error?.code === '23505'
  && (error?.constraint === 'temas_pkey' || String(error?.message ?? '').includes('temas_pkey'))
);

export const catalogAdminTaxonomiaService = {
  async createTema(oposicionId, nombre) {
    try {
      return await catalogAdminRepository.createTema(oposicionId, nombre);
    } catch (error) {
      if (!isTemaPrimaryKeySequenceCollision(error)) throw error;

      await catalogAdminRepository.syncTemaIdSequence();
      return catalogAdminRepository.createTema(oposicionId, nombre);
    }
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

  async createBloque(temaId, nombre) {
    return catalogAdminRepository.createBloque(temaId, nombre);
  },

  async updateBloque(id, nombre) {
    const result = await catalogAdminRepository.updateBloque(id, nombre);
    if (!result) throw new ApiError(404, 'Bloque no encontrado');
    return result;
  },

  async deleteBloque(id) {
    const result = await catalogAdminRepository.deleteBloque(id);
    if (!result) throw new ApiError(404, 'Bloque no encontrado');
    return result;
  },
};
