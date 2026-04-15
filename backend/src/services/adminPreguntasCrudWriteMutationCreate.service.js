import pool from '../config/db.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudWriteMutationCreateService = {
  async createPregunta(payload, userId, userRole) {
    const client = await pool.connect();

    const estadoInicial = userRole === 'editor' ? 'pendiente' : 'aprobada';

    try {
      await client.query('BEGIN');
      const pregunta = await adminRepository.createPregunta(client, { ...payload, estado: estadoInicial });
      await adminRepository.createOpciones(client, pregunta.id, payload.opciones);
      await client.query('COMMIT');
      adminRepository.insertAuditoria({ accion: 'create', preguntaId: pregunta.id, userId, userRole }).catch(() => {});
      return { id: pregunta.id, estado: estadoInicial };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
