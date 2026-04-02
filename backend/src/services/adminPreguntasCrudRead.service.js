import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudReadService = {
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

  async getPregunta(preguntaId) {
    const pregunta = await adminRepository.getFullPreguntaById(preguntaId);
    if (!pregunta) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    return pregunta;
  },

  async listPreguntasSinRevisar(query) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const offset = (page - 1) * pageSize;
    const { rows, total } = await adminRepository.listPreguntasSinRevisar(
      {
        oposicionId: query.oposicion_id,
        materiaId: query.materia_id,
        temaId: query.tema_id,
      },
      pageSize,
      offset,
    );
    return {
      items: rows.map((p) => ({
        id: p.id,
        enunciado: p.enunciado,
        nivelDificultad: p.nivel_dificultad,
        estado: p.estado,
        fechaActualizacion: p.fecha_actualizacion,
        temaNombre: p.tema_nombre,
        materiaNombre: p.materia_nombre,
        oposicionNombre: p.oposicion_nombre,
      })),
      pagination: { page, pageSize, total },
    };
  },

  async getPreguntasPorEstado() {
    return adminRepository.getPreguntasPorEstado();
  },
};
