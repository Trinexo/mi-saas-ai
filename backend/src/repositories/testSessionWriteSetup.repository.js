import pool from '../config/db.js';

export const testSessionWriteSetupRepository = {
  async createTest({ userId, bloqueId, oposicionId, tipoTest, numeroPreguntas, duracionSegundos }) {
    const result = await pool.query(
      `INSERT INTO tests (usuario_id, bloque_id, oposicion_id, tipo_test, numero_preguntas, duracion_segundos, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'generado')
       RETURNING id`,
      [userId, bloqueId || null, oposicionId || null, tipoTest, numeroPreguntas, duracionSegundos || null],
    );
    return result.rows[0];
  },

  async insertTestPreguntas(testId, preguntaIds) {
    const values = preguntaIds.map((preguntaId, index) => `($1, ${preguntaId}, ${index + 1})`).join(',');
    await pool.query(`INSERT INTO tests_preguntas (test_id, pregunta_id, orden) VALUES ${values}`, [testId]);
  },

  async getContextoNombres(bloqueId, oposicionId) {
    let bloqueNombre = null;
    let oposicionNombre = null;
    if (bloqueId) {
      const r = await pool.query('SELECT nombre FROM bloques WHERE id = $1', [bloqueId]);
      if (r.rows[0]) bloqueNombre = r.rows[0].nombre;
    }
    if (oposicionId) {
      const r = await pool.query('SELECT nombre FROM oposiciones WHERE id = $1', [oposicionId]);
      if (r.rows[0]) oposicionNombre = r.rows[0].nombre;
    }
    return { bloqueNombre, oposicionNombre };
  },
};
