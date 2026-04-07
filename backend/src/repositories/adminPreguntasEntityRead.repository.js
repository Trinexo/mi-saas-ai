import pool from '../config/db.js';

export const adminPreguntasEntityReadRepository = {
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
