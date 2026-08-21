import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudReadListPreguntasService = {
  async listPreguntas(query, caller = {}) {
    const temaIds = String(query.tema_ids ?? '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
    const anioIds = String(query.anio_ids ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value));
    const examenIds = String(query.examen_ids ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value));

    const {
      page,
      page_size: pageSize,
      q,
      estado,
      oposicion_id: oposicionId,
      tema_id: temaId,
      bloque_id: bloqueId,
      nivel_dificultad: nivelDificultad,
      officialidad,
      anio,
      examen_id: examenId,
    } = query;

    const filters = {
      oposicionId: oposicionId ?? null,
      temaId: temaId ?? null,
      temaIds: temaIds.length ? [...new Set(temaIds)] : null,
      bloqueId: bloqueId ?? null,
      nivelDificultad: nivelDificultad ?? null,
      q: q ?? null,
      estado: estado ?? null,
      officialidad: officialidad ?? 'all',
      anio: anio ?? null,
      anioIds: anioIds.length ? [...new Set(anioIds)] : [],
      examenId: examenId ?? null,
      examenIds: examenIds.length ? [...new Set(examenIds)] : [],
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
