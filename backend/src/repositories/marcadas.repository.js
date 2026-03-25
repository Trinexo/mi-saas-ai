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

  async getMarcadas(userId) {
    const result = await pool.query(
      `SELECT
         pm.pregunta_id   AS id,
         p.enunciado,
         p.explicacion,
         p.nivel_dificultad,
         t.id             AS tema_id,
         t.nombre         AS tema_nombre,
         o.id             AS oposicion_id,
         o.nombre         AS oposicion_nombre,
         pm.fecha_marcado
       FROM preguntas_marcadas pm
       JOIN preguntas p ON p.id = pm.pregunta_id
       JOIN temas t     ON t.id = p.tema_id
       JOIN materias m  ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       WHERE pm.usuario_id = $1
       ORDER BY pm.fecha_marcado DESC`,
      [userId],
    );
    return result.rows.map((row) => ({
      id: Number(row.id),
      enunciado: row.enunciado,
      explicacion: row.explicacion || null,
      nivelDificultad: row.nivel_dificultad,
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      fechaMarcado: row.fecha_marcado,
    }));
  },
};
