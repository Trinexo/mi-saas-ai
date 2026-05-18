import pool from '../config/db.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasImportPersistService = {
  async ensureTemaExists(temaId) {
    return adminRepository.existsTema(temaId);
  },

  async ensureTemaInOposiciones(temaId, oposicionIds) {
    return adminRepository.existsTemaInOposiciones(temaId, oposicionIds);
  },

  async listAssignedOposiciones(userId) {
    return adminRepository.listUserAssignedOposiciones(userId);
  },

  async insertPreguntaConOpciones(payload) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const pregunta = await adminRepository.createPregunta(client, payload);
      await adminRepository.createOpciones(client, pregunta.id, payload.opciones);

      if (payload.coleccionId) {
        await client.query(
          `INSERT INTO colecciones_preguntas (coleccion_id, pregunta_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [payload.coleccionId, pregunta.id],
        );
      }

      await client.query('COMMIT');
      return pregunta;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
