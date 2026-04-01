import pool from '../config/db.js';

export const testSessionRepository = {
  async getUserHistory({ userId, limit, page, oposicionId, desde, hasta }) {
    const conditions = ['t.usuario_id = $1', "t.estado = 'finalizado'"];
    const params = [userId];
    let idx = 2;

    if (oposicionId) { conditions.push(`t.oposicion_id = $${idx++}`); params.push(oposicionId); }
    if (desde) { conditions.push(`t.fecha_creacion >= $${idx++}`); params.push(desde); }
    if (hasta) { conditions.push(`t.fecha_creacion < ($${idx++}::date + interval '1 day')`); params.push(hasta); }

    const where = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT t.id, t.fecha_creacion, t.tipo_test, t.duracion_segundos, t.numero_preguntas, t.estado,
                t.tema_id, te.nombre AS tema_nombre,
                ma.nombre AS materia_nombre,
                t.oposicion_id, op.nombre AS oposicion_nombre,
                rt.aciertos, rt.errores, rt.blancos, rt.nota, rt.tiempo_segundos
         FROM tests t
         LEFT JOIN temas te ON te.id = t.tema_id
         LEFT JOIN materias ma ON ma.id = te.materia_id
         LEFT JOIN oposiciones op ON op.id = t.oposicion_id
         LEFT JOIN resultados_test rt ON rt.test_id = t.id
         WHERE ${where}
         ORDER BY t.fecha_creacion DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      ),
      pool.query(`SELECT COUNT(*) FROM tests t WHERE ${where}`, params),
    ]);

    return {
      total: Number(countResult.rows[0].count),
      page,
      pageSize: limit,
      items: dataResult.rows.map((row) => ({
        id: Number(row.id),
        fecha: row.fecha_creacion,
        tipoTest: row.tipo_test,
        duracionSegundos: row.duracion_segundos,
        numeroPreguntas: row.numero_preguntas,
        estado: row.estado,
        temaId: row.tema_id ? Number(row.tema_id) : null,
        temaNombre: row.tema_nombre || null,
        materiaNombre: row.materia_nombre || null,
        oposicionId: row.oposicion_id ? Number(row.oposicion_id) : null,
        oposicionNombre: row.oposicion_nombre || null,
        aciertos: row.aciertos ?? 0,
        errores: row.errores ?? 0,
        blancos: row.blancos ?? 0,
        nota: row.nota ?? 0,
        tiempoSegundos: row.tiempo_segundos ?? 0,
      })),
    };
  },

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

  async createTest({ userId, temaId, oposicionId, tipoTest, numeroPreguntas, duracionSegundos }) {
    const result = await pool.query(
      `INSERT INTO tests (usuario_id, tema_id, oposicion_id, tipo_test, numero_preguntas, duracion_segundos, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'generado')
       RETURNING id`,
      [userId, temaId || null, oposicionId || null, tipoTest, numeroPreguntas, duracionSegundos || null],
    );
    return result.rows[0];
  },

  async insertTestPreguntas(testId, preguntaIds) {
    const values = preguntaIds.map((preguntaId, index) => `($1, ${preguntaId}, ${index + 1})`).join(',');
    await pool.query(`INSERT INTO tests_preguntas (test_id, pregunta_id, orden) VALUES ${values}`, [testId]);
  },

  async getContextoNombres(temaId, oposicionId) {
    let temaNombre = null;
    let oposicionNombre = null;
    if (temaId) {
      const r = await pool.query('SELECT nombre FROM temas WHERE id = $1', [temaId]);
      if (r.rows[0]) temaNombre = r.rows[0].nombre;
    }
    if (oposicionId) {
      const r = await pool.query('SELECT nombre FROM oposiciones WHERE id = $1', [oposicionId]);
      if (r.rows[0]) oposicionNombre = r.rows[0].nombre;
    }
    return { temaNombre, oposicionNombre };
  },

  async getTestById(client, testId) {
    const result = await client.query('SELECT id, usuario_id, estado FROM tests WHERE id = $1', [testId]);
    return result.rows[0] ?? null;
  },

  async getCorrectAnswersByTest(client, testId) {
    const result = await client.query(
      `SELECT tp.pregunta_id, o.id AS opcion_id
       FROM tests_preguntas tp
       JOIN opciones_respuesta o ON o.pregunta_id = tp.pregunta_id AND o.correcta = TRUE
       WHERE tp.test_id = $1`,
      [testId],
    );

    return new Map(result.rows.map((row) => [Number(row.pregunta_id), Number(row.opcion_id)]));
  },

  async insertRespuesta(client, payload) {
    await client.query(
      `INSERT INTO respuestas_usuario (test_id, pregunta_id, respuesta_id, correcta)
       VALUES ($1, $2, $3, $4)`,
      [payload.testId, payload.preguntaId, payload.respuestaId, payload.correcta],
    );
  },

  async insertResultado(client, payload) {
    await client.query(
      `INSERT INTO resultados_test (test_id, aciertos, errores, blancos, nota, tiempo_segundos)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [payload.testId, payload.aciertos, payload.errores, payload.blancos, payload.nota, payload.tiempoSegundos],
    );
  },

  async markTestAsDone(client, testId) {
    await client.query('UPDATE tests SET estado = $2 WHERE id = $1', [testId, 'finalizado']);
  },

  async updateProgress(client, { testId }) {
    await client.query(
      `INSERT INTO progreso_usuario (usuario_id, tema_id, preguntas_vistas, aciertos, errores, tiempo_medio)
    SELECT t.usuario_id,
      t.tema_id,
      t.numero_preguntas AS preguntas_vistas,
      rt.aciertos,
      rt.errores,
      rt.tiempo_segundos AS tiempo_medio
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
    WHERE t.id = $1
       ON CONFLICT (usuario_id, tema_id)
       DO UPDATE SET
         preguntas_vistas = progreso_usuario.preguntas_vistas + EXCLUDED.preguntas_vistas,
         aciertos = progreso_usuario.aciertos + EXCLUDED.aciertos,
         errores = progreso_usuario.errores + EXCLUDED.errores,
         tiempo_medio = GREATEST(1, ((progreso_usuario.tiempo_medio + EXCLUDED.tiempo_medio) / 2))`,
      [testId],
    );
  },
};
