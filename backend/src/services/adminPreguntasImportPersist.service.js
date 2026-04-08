import pool from '../config/db.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const adminPreguntasImportPersistService = {
  async ensureTemaExists(temaId) {
    return adminRepository.existsTema(temaId);
  },

  async insertPreguntaConOpciones(payload) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const pregunta = await adminRepository.createPregunta(client, payload);
      await adminRepository.createOpciones(client, pregunta.id, payload.opciones);
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
