import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudReadListSinRevisarService = {
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
};
