import pool from '../config/db.js';

export const catalogRepository = {
  async getOposiciones({ includeEmpty = false } = {}) {
    const result = await pool.query(
      `SELECT o.id, o.nombre, o.descripcion, o.precio_mensual_cents, o.tiempo_limite_minutos
       FROM oposiciones o
       WHERE ($1::boolean = TRUE OR EXISTS (
         SELECT 1 FROM temas t
         JOIN preguntas p ON p.tema_id = t.id
         WHERE t.oposicion_id = o.id
       ))
       ORDER BY o.nombre ASC`,
      [includeEmpty],
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
      'SELECT id, tema_id, nombre FROM colecciones WHERE tema_id = $1 ORDER BY nombre ASC',
      [temaId],
    );
    return result.rows;
  },

  async getColecciones(temaId) {
    const result = await pool.query(
      `SELECT c.id, c.tema_id, c.nombre, c.descripcion, c.publica,
              COUNT(cp.pregunta_id)::int AS total_preguntas
       FROM colecciones c
       LEFT JOIN colecciones_preguntas cp ON cp.coleccion_id = c.id
       WHERE c.tema_id = $1 AND c.publica = TRUE
       GROUP BY c.id
       ORDER BY c.nombre ASC`,
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
