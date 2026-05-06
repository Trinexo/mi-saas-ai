import pool from '../config/db.js';

export const adminPreguntasEntityReadRepository = {
  async getPreguntaById(client, preguntaId) {
    const result = await client.query('SELECT id FROM preguntas WHERE id = $1', [preguntaId]);
    return result.rows[0] ?? null;
  },

  async getFullPreguntaById(preguntaId) {
    const pregResult = await pool.query(
      `SELECT p.id, p.bloque_id, p.enunciado, p.explicacion,
              p.referencia_normativa, p.nivel_dificultad,
              p.fecha_actualizacion,
              bl.tema_id, t.oposicion_id
       FROM preguntas p
       JOIN bloques bl ON bl.id = p.bloque_id
       JOIN temas t    ON t.id  = bl.tema_id
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

  async existsTema(temaId) {
    const result = await pool.query('SELECT id FROM bloques WHERE id = $1', [bloqueId]);
    return result.rowCount > 0;
  },
};
