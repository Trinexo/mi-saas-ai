import pool from '../config/db.js';

export const adminPreguntasEntityWriteRepository = {
  async createPregunta(client, payload) {
    const result = await client.query(
      `INSERT INTO preguntas (tema_id, enunciado, explicacion, referencia_normativa, nivel_dificultad, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        payload.temaId,
        payload.enunciado,
        payload.explicacion,
        payload.referenciaNormativa ?? null,
        payload.nivelDificultad,
        payload.estado ?? 'aprobada',
      ],
    );

    return result.rows[0];
  },

  async createOpciones(client, preguntaId, opciones) {
    for (const opcion of opciones) {
      await client.query(
        `INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
         VALUES ($1, $2, $3)`,
        [preguntaId, opcion.texto, opcion.correcta],
      );
    }
  },

  async updatePregunta(client, preguntaId, payload) {
    await client.query(
      `UPDATE preguntas
       SET tema_id = $2,
           enunciado = $3,
           explicacion = $4,
           referencia_normativa = $5,
           nivel_dificultad = $6,
           fecha_actualizacion = NOW()
       WHERE id = $1`,
      [
        preguntaId,
        payload.temaId,
        payload.enunciado,
        payload.explicacion,
        payload.referenciaNormativa ?? null,
        payload.nivelDificultad,
      ],
    );
  },

  async deleteOpciones(client, preguntaId) {
    await client.query('DELETE FROM opciones_respuesta WHERE pregunta_id = $1', [preguntaId]);
  },

  async deletePregunta(preguntaId) {
    const result = await pool.query('DELETE FROM preguntas WHERE id = $1 RETURNING id', [preguntaId]);
    return result.rowCount > 0;
  },
};
