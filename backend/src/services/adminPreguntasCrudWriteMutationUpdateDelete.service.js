import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudWriteMutationUpdateDeleteService = {
  async updatePregunta(preguntaId, payload, userId, userRole) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const exists = await adminRepository.getPreguntaById(client, preguntaId);
      if (!exists) {
        throw new ApiError(404, 'Pregunta no encontrada');
      }

      await adminRepository.updatePregunta(client, preguntaId, payload);
      await adminRepository.deleteOpciones(client, preguntaId);
      await adminRepository.createOpciones(client, preguntaId, payload.opciones);

      await client.query('COMMIT');
      adminRepository.insertAuditoria({ accion: 'update', preguntaId, userId, userRole, datosAnteriores: exists }).catch(() => {});
      return { id: preguntaId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async deletePregunta(preguntaId, userId, userRole) {
    const snapshot = await adminRepository.getFullPreguntaById(preguntaId);
    if (!snapshot) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    await adminRepository.deletePregunta(preguntaId);
    adminRepository.insertAuditoria({ accion: 'delete', preguntaId, userId, userRole, datosAnteriores: snapshot }).catch(() => {});
    return { id: preguntaId };
  },
};
