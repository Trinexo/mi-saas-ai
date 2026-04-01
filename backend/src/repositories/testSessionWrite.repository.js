import pool from '../config/db.js';

export const testSessionWriteRepository = {
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
