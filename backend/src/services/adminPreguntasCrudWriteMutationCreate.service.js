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

    const estadoInicial = 'aprobada';

    try {
      await client.query('BEGIN');
      const pregunta = await adminRepository.createPregunta(client, { ...payload, estado: estadoInicial });
      await adminRepository.createOpciones(client, pregunta.id, payload.opciones);
      // Una pregunta no oficial no debe tocar las relaciones editoriales
      // opcionales. Solo se sincronizan cuando el payload las proporciona.
      if (Array.isArray(payload.anioIds)) {
        await adminRepository.setYearsForPreguntaWithClient(client, pregunta.id, payload.anioIds);
      }
      if (Array.isArray(payload.examenIds)) {
        await adminRepository.setExamsForPreguntaWithClient(client, pregunta.id, payload.examenIds);
      }
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
