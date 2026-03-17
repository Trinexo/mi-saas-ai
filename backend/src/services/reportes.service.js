import { reportesRepository } from '../repositories/reportes.repository.js';

export const reportesService = {
  async reportar(userId, preguntaId, motivo) {
    const result = await reportesRepository.createReporte(userId, preguntaId, motivo);
    return { ...result, already: !result.created };
  },
};
