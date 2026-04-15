import { ApiError } from '../utils/api-error.js';
import { catalogRepository } from '../repositories/catalog.repository.js';

export const catalogPreguntasService = {
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