import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';

const isProfesor = (caller = {}) => caller.role === 'profesor';

export const adminPreguntasCrudWriteMutationUpdateDeleteService = {
  async updatePregunta(preguntaId, payload, userId, userRole) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const exists = await adminRepository.getPreguntaById(client, preguntaId);
      if (!exists) {
        throw new ApiError(404, 'Pregunta no encontrada');
      }

      if (isProfesor({ role: userRole })) {
        const allowed = await profesorAccessRepository.hasAssignedPregunta(userId, preguntaId);
        if (!allowed) {
          throw new ApiError(403, 'No tienes acceso a esta pregunta');
        }

        // El tema puede cambiarse durante la edición: el destino también debe
        // permanecer dentro del ámbito de oposiciones asignadas al profesor.
        if (payload.temaId !== undefined) {
          const allowedTarget = await profesorAccessRepository.hasAssignedTema(userId, payload.temaId);
          if (!allowedTarget) {
            throw new ApiError(403, 'El tema no pertenece a tus oposiciones asignadas');
          }
        }
      }

      await adminRepository.updatePregunta(client, preguntaId, payload);
      await adminRepository.updateOpciones(client, preguntaId, payload.opciones);
      if (Array.isArray(payload.anioIds)) {
        await adminRepository.setYearsForPreguntaWithClient(client, preguntaId, payload.anioIds);
      }
      if (Array.isArray(payload.examenIds)) {
        await adminRepository.setExamsForPreguntaWithClient(client, preguntaId, payload.examenIds);
      }

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

    if (isProfesor({ role: userRole })) {
      const assignedIds = await profesorAccessRepository.listAssignedOposicionIds(userId);
      if (assignedIds.length === 0) {
        throw new ApiError(403, 'No tienes oposiciones asignadas');
      }

      if (!assignedIds.includes(Number(snapshot.oposicion_id))) {
        throw new ApiError(403, 'No tienes acceso a esta pregunta');
      }
    }

    await adminRepository.deletePregunta(preguntaId);
    adminRepository.insertAuditoria({ accion: 'delete', preguntaId, userId, userRole, datosAnteriores: snapshot }).catch(() => {});
    return { id: preguntaId };
  },
};
