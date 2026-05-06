import pool from '../config/db.js';

export const catalogRepository = {
  async getOposiciones() {
    const result = await pool.query(
      'SELECT id, nombre, descripcion, precio_mensual_cents, tiempo_limite_minutos FROM oposiciones ORDER BY nombre ASC',
    );
    return result.rows;
  },

  async getTemas(oposicionId) {
    const result = await pool.query(
      'SELECT id, oposicion_id, nombre FROM temas WHERE oposicion_id = $1 ORDER BY nombre ASC',
      [oposicionId],
    );
    return result.rows;
  },

  async getBloques(temaId) {
    const result = await pool.query(
      'SELECT id, tema_id, nombre FROM bloques WHERE tema_id = $1 ORDER BY nombre ASC',
      [temaId],
    );
    return result.rows;
  },

  async getPreguntas(bloqueId, limit, offset) {
    const result = await pool.query(
      `SELECT p.id, p.bloque_id, p.enunciado, p.explicacion, p.nivel_dificultad,
              json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
       FROM preguntas p
       JOIN opciones_respuesta o ON o.pregunta_id = p.id
       WHERE p.bloque_id = $1
       GROUP BY p.id
       ORDER BY p.id ASC
       LIMIT $2 OFFSET $3`,
      [bloqueId, limit, offset],
    );
    return result.rows;
  },

  async countPreguntas(bloqueId) {
    const result = await pool.query('SELECT COUNT(*)::int AS total FROM preguntas WHERE bloque_id = $1', [bloqueId]);
    return result.rows[0].total;
  },
};