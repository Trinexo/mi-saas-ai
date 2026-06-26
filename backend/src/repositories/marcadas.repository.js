import pool from '../config/db.js';

export const marcadasRepository = {
  async marcar(userId, preguntaId) {
    await pool.query(
      `INSERT INTO preguntas_marcadas (usuario_id, pregunta_id)
       VALUES ($1, $2)
       ON CONFLICT (usuario_id, pregunta_id) DO NOTHING`,
      [userId, preguntaId],
    );
    return { marcada: true };
  },

  async desmarcar(userId, preguntaId) {
    await pool.query(
      `DELETE FROM preguntas_marcadas WHERE usuario_id = $1 AND pregunta_id = $2`,
      [userId, preguntaId],
    );
    return { marcada: false };
  },

  async getMarcadas(userId, oposicionId = null) {
    const result = await pool.query(
      `SELECT
         pm.pregunta_id   AS id,
         p.enunciado,
         p.explicacion,
         p.nivel_dificultad,
         bl.id             AS bloque_id,
         bl.nombre         AS bloque_nombre,
         t.id              AS tema_id,
         t.nombre          AS tema_nombre,
         o.id             AS oposicion_id,
         o.nombre         AS oposicion_nombre,
         pm.fecha_marcado
       FROM preguntas_marcadas pm
       JOIN preguntas p ON p.id = pm.pregunta_id
       JOIN bloques bl  ON bl.id = p.bloque_id
       JOIN temas t     ON t.id  = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE pm.usuario_id = $1
         AND ($2::bigint IS NULL OR o.id = $2)
       ORDER BY pm.fecha_marcado DESC`,
      [userId, oposicionId],
    );
    return result.rows.map((row) => ({
      id: Number(row.id),
      enunciado: row.enunciado,
      explicacion: row.explicacion || null,
      nivelDificultad: row.nivel_dificultad,
      bloqueId: Number(row.bloque_id),
      bloqueNombre: row.bloque_nombre,
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      fechaMarcado: row.fecha_marcado,
    }));
  },
};
