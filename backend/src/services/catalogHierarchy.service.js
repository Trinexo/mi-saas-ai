import { ApiError } from '../utils/api-error.js';
import { catalogRepository } from '../repositories/catalog.repository.js';

export const catalogHierarchyService = {
  async getOposiciones() {
    return catalogRepository.getOposiciones();
  },

  async getTemas(oposicionId) {
    if (!Number.isFinite(oposicionId)) {
      throw new ApiError(400, 'oposicion_id es obligatorio');
    }

    return catalogRepository.getTemas(oposicionId);
  },

  async getBloques(temaId) {
    if (!Number.isFinite(temaId)) {
      throw new ApiError(400, 'tema_id es obligatorio');
    }

    return catalogRepository.getBloques(temaId);
  },
};