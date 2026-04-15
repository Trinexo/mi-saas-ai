import { ApiError } from '../utils/api-error.js';
import { catalogRepository } from '../repositories/catalog.repository.js';

export const catalogHierarchyService = {
  async getOposiciones() {
    return catalogRepository.getOposiciones();
  },

  async getMaterias(oposicionId) {
    if (!Number.isFinite(oposicionId)) {
      throw new ApiError(400, 'oposicion_id es obligatorio');
    }

    return catalogRepository.getMaterias(oposicionId);
  },

  async getTemas(materiaId) {
    if (!Number.isFinite(materiaId)) {
      throw new ApiError(400, 'materia_id es obligatorio');
    }

    return catalogRepository.getTemas(materiaId);
  },
};