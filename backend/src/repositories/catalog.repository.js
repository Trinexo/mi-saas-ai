import pool from '../config/db.js';

export const catalogRepository = {
  async getOposiciones() {
    const result = await pool.query(
      'SELECT id, nombre, descripcion, precio_mensual_cents, tiempo_limite_minutos FROM oposiciones ORDER BY nombre ASC',
    );
    return result.rows;
  },

  async getMaterias(oposicionId) {
    const result = await pool.query(
      'SELECT id, oposicion_id, nombre FROM materias WHERE oposicion_id = $1 ORDER BY nombre ASC',
      [oposicionId],
    );
    return result.rows;
  },

  async getTemas(materiaId) {
    const result = await pool.query(
      'SELECT id, materia_id, nombre FROM temas WHERE materia_id = $1 ORDER BY nombre ASC',
      [materiaId],
    );
    return result.rows;
  },

  async getPreguntas(temaId, limit, offset) {
    const result = await pool.query(
      `SELECT p.id, p.tema_id, p.enunciado, p.explicacion, p.nivel_dificultad,
              json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
       FROM preguntas p
       JOIN opciones_respuesta o ON o.pregunta_id = p.id
       WHERE p.tema_id = $1
       GROUP BY p.id
       ORDER BY p.id ASC
       LIMIT $2 OFFSET $3`,
      [temaId, limit, offset],
    );
    return result.rows;
  },

  async countPreguntas(temaId) {
    const result = await pool.query('SELECT COUNT(*)::int AS total FROM preguntas WHERE tema_id = $1', [temaId]);
    return result.rows[0].total;
  },
};