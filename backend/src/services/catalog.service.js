import { ApiError } from '../utils/api-error.js';
import { catalogRepository } from '../repositories/catalog.repository.js';

export const catalogService = {
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

  async getPreguntas({ temaId, page, pageSize }) {
    if (!Number.isFinite(temaId)) {
      throw new ApiError(400, 'tema_id es obligatorio');
    }

    const [items, total] = await Promise.all([
      catalogRepository.getPreguntas(temaId, pageSize, (page - 1) * pageSize),
      catalogRepository.countPreguntas(temaId),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
};