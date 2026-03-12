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

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : 20;

    const [items, total] = await Promise.all([
      catalogRepository.getPreguntas(temaId, safePageSize, (safePage - 1) * safePageSize),
      catalogRepository.countPreguntas(temaId),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        total,
        totalPages: Math.ceil(total / safePageSize),
      },
    };
  },
};