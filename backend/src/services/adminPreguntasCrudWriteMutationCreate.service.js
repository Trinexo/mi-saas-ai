import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasCrudWriteMutationCreateService = {
  async createPregunta(payload, caller = {}) {
    const { userId, role: userRole } = caller;
    const client = await pool.connect();

    if (userRole === 'profesor') {
      const assignedIds = await adminRepository.listUserAssignedOposiciones(userId);
      if (assignedIds.length === 0) {
        throw new ApiError(403, 'No tienes oposiciones asignadas');
      }
      const allowed = await adminRepository.existsTemaInOposiciones(payload.temaId, assignedIds);
      if (!allowed) {
        throw new ApiError(403, 'El tema no pertenece a tus oposiciones asignadas');
      }
    }

    const estadoInicial = userRole === 'profesor' ? 'pendiente' : 'aprobada';

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
