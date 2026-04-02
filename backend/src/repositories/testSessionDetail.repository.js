import pool from '../config/db.js';

export const testSessionDetailRepository = {
  async getTestReview(userId, testId) {
    const testResult = await pool.query(
      `SELECT t.id, t.tema_id, te.nombre AS tema_nombre,
              t.oposicion_id, op.nombre AS oposicion_nombre,
              t.numero_preguntas, t.tipo_test, t.fecha_creacion,
              rt.aciertos, rt.errores, rt.blancos, rt.nota, rt.tiempo_segundos
       FROM tests t
       LEFT JOIN temas te ON te.id = t.tema_id
       LEFT JOIN oposiciones op ON op.id = t.oposicion_id
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.id = $1 AND t.usuario_id = $2`,
      [testId, userId],
    );
    if (!testResult.rows[0]) return null;

    const preguntasResult = await pool.query(
      `SELECT p.id AS pregunta_id, p.enunciado, p.explicacion,
              ru.respuesta_id AS elegida_id, ru.correcta,
              (SELECT o2.id FROM opciones_respuesta o2 WHERE o2.pregunta_id = p.id AND o2.correcta = TRUE LIMIT 1) AS correcta_id,
              json_agg(json_build_object('id', o.id, 'texto', o.texto, 'correcta', o.correcta) ORDER BY o.id) AS opciones
       FROM tests_preguntas tp
       JOIN preguntas p ON p.id = tp.pregunta_id
       JOIN opciones_respuesta o ON o.pregunta_id = p.id
       LEFT JOIN respuestas_usuario ru ON ru.test_id = tp.test_id AND ru.pregunta_id = tp.pregunta_id
       WHERE tp.test_id = $1
       GROUP BY p.id, ru.respuesta_id, ru.correcta
       ORDER BY tp.orden`,
      [testId],
    );
    const t = testResult.rows[0];
    return {
      test: {
        id: Number(t.id),
        temaId: t.tema_id ? Number(t.tema_id) : null,
        temaNombre: t.tema_nombre || null,
        oposicionId: t.oposicion_id ? Number(t.oposicion_id) : null,
        oposicionNombre: t.oposicion_nombre || null,
        numeroPreguntas: Number(t.numero_preguntas),
        tipoTest: t.tipo_test,
        fechaCreacion: t.fecha_creacion,
        aciertos: t.aciertos ?? 0,
        errores: t.errores ?? 0,
        blancos: t.blancos ?? 0,
        nota: t.nota ?? 0,
        tiempoSegundos: t.tiempo_segundos ?? 0,
      },
      preguntas: preguntasResult.rows.map(p => ({
        preguntaId: Number(p.pregunta_id),
        enunciado: p.enunciado,
        explicacion: p.explicacion || null,
        respuestaUsuarioId: p.elegida_id ? Number(p.elegida_id) : null,
        esCorrecta: Boolean(p.correcta),
        correctaId: Number(p.correcta_id),
        opciones: p.opciones,
      })),
    };
  },

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
