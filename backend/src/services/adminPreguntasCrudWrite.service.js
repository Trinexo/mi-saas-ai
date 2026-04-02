import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudWriteService = {
  async createPregunta(payload, userId, userRole) {
    const client = await pool.connect();

    // Editores crean preguntas en estado pendiente; admins las crean directamente aprobadas
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

  async updatePreguntaEstado(preguntaId, estado, requestingUser) {
    const allowed = ['revisor', 'admin'];
    if (!allowed.includes(requestingUser.role)) {
      throw new ApiError(403, 'Solo revisores y admins pueden cambiar el estado de preguntas');
    }
    const updated = await adminRepository.updatePreguntaEstado(preguntaId, estado);
    if (!updated) {
      throw new ApiError(404, 'Pregunta no encontrada');
    }
    return updated;
  },
};
