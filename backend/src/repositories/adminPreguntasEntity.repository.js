import pool from '../config/db.js';

export const adminPreguntasEntityRepository = {
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

  async getPreguntaById(client, preguntaId) {
    const result = await client.query('SELECT id FROM preguntas WHERE id = $1', [preguntaId]);
    return result.rows[0] ?? null;
  },

  async getFullPreguntaById(preguntaId) {
    const pregResult = await pool.query(
      `SELECT p.id, p.tema_id, p.enunciado, p.explicacion,
              p.referencia_normativa, p.nivel_dificultad,
              p.estado, p.fecha_actualizacion,
              t.materia_id, m.oposicion_id
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       WHERE p.id = $1`,
      [preguntaId],
    );
    if (!pregResult.rows[0]) return null;
    const opResult = await pool.query(
      'SELECT id, texto, correcta FROM opciones_respuesta WHERE pregunta_id = $1 ORDER BY id',
      [preguntaId],
    );
    return { ...pregResult.rows[0], opciones: opResult.rows };
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

  async existsTema(temaId) {
    const result = await pool.query('SELECT id FROM temas WHERE id = $1', [temaId]);
    return result.rowCount > 0;
  },

  async updatePreguntaEstado(preguntaId, estado) {
    const result = await pool.query(
      `UPDATE preguntas SET estado = $2, fecha_actualizacion = NOW()
       WHERE id = $1
       RETURNING id, enunciado, estado`,
      [preguntaId, estado],
    );
    return result.rows[0] ?? null;
  },
};
