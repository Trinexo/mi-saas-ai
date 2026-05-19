import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudReadListPreguntasService = {
  async listPreguntas(query, caller = {}) {
    const {
      page,
      page_size: pageSize,
      q,
      estado,
      oposicion_id: oposicionId,
      tema_id: temaId,
      bloque_id: bloqueId,
      nivel_dificultad: nivelDificultad,
    } = query;

    const filters = {
      oposicionId: oposicionId ?? null,
      temaId: temaId ?? null,
      bloqueId: bloqueId ?? null,
      nivelDificultad: nivelDificultad ?? null,
      q: q ?? null,
      estado: estado ?? null,
    };

    if (caller.role === 'profesor') {
      const assignedIds = await adminRepository.listUserAssignedOposiciones(caller.userId);
      if (assignedIds.length === 0) {
        throw new ApiError(403, 'No tienes oposiciones asignadas');
      }
      filters.allowedOposicionIds = assignedIds;
    }

    const [items, total] = await Promise.all([
      adminRepository.listPreguntas(filters, pageSize, (page - 1) * pageSize),
      adminRepository.countPreguntas(filters),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
      },
    };
  },
};
