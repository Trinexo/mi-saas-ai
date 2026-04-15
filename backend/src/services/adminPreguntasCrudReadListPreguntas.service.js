import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudReadListPreguntasService = {
  async listPreguntas(query) {
    const {
      page,
      page_size: pageSize,
      oposicion_id: oposicionId,
      materia_id: materiaId,
      tema_id: temaId,
      nivel_dificultad: nivelDificultad,
    } = query;

    const filters = {
      oposicionId: oposicionId ?? null,
      materiaId: materiaId ?? null,
      temaId: temaId ?? null,
      nivelDificultad: nivelDificultad ?? null,
    };

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
