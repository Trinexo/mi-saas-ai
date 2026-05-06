import { ApiError } from '../utils/api-error.js';
import { catalogRepository } from '../repositories/catalog.repository.js';

export const catalogPreguntasService = {
  async getPreguntas({ bloqueId, page, pageSize }) {
    if (!Number.isFinite(bloqueId)) {
      throw new ApiError(400, 'bloque_id es obligatorio');
    }

    const [items, total] = await Promise.all([
      catalogRepository.getPreguntas(bloqueId, pageSize, (page - 1) * pageSize),
      catalogRepository.countPreguntas(bloqueId),
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