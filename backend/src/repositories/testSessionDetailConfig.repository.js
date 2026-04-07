import pool from '../config/db.js';

export const testSessionDetailConfigRepository = {
  async getTestConfig(userId, testId) {
    const result = await pool.query(
      `SELECT t.id, t.tema_id, t.oposicion_id, t.numero_preguntas, t.tipo_test, t.estado,
              json_agg(json_build_object('id', p.id, 'enunciado', p.enunciado, 'nivel_dificultad', p.nivel_dificultad,
                'opciones', (
                  SELECT json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id)
                  FROM opciones_respuesta o WHERE o.pregunta_id = p.id
                )) ORDER BY tp.orden) AS preguntas
       FROM tests t
       JOIN tests_preguntas tp ON tp.test_id = t.id
       JOIN preguntas p ON p.id = tp.pregunta_id
       WHERE t.id = $1 AND t.usuario_id = $2
       GROUP BY t.id`,
      [testId, userId],
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      id: Number(row.id),
      temaId: row.tema_id ? Number(row.tema_id) : null,
      oposicionId: row.oposicion_id ? Number(row.oposicion_id) : null,
      tipoTest: row.tipo_test,
      numeroPreguntas: Number(row.numero_preguntas),
      estado: row.estado,
      preguntas: row.preguntas,
    };
  },
};
