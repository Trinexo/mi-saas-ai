import pool from '../config/db.js';

const examFields = `
  eo.id::text AS id, eo.oposicion_id::text AS oposicion_id,
  eo.oposicion_anio_id::text AS oposicion_anio_id,
  eo.nombre, eo.anio, eo.convocatoria, eo.fecha
`;

export const examenesOficialesRepository = {
  async listYears(oposicionId) {
    const result = await pool.query(
      `SELECT id::text AS id, oposicion_id::text AS oposicion_id, anio
         FROM oposiciones_anios_oficiales
        WHERE oposicion_id = $1 ORDER BY anio DESC`,
      [oposicionId],
    );
    return result.rows;
  },

  async createYear(oposicionId, anio) {
    const result = await pool.query(
      `INSERT INTO oposiciones_anios_oficiales (oposicion_id, anio)
       VALUES ($1, $2)
       ON CONFLICT (oposicion_id, anio) DO UPDATE SET anio = EXCLUDED.anio
       RETURNING id::text AS id, oposicion_id::text AS oposicion_id, anio`,
      [oposicionId, anio],
    );
    return result.rows[0];
  },

  async listYearsForPregunta(preguntaId) {
    const result = await pool.query(
      `SELECT oao.id::text AS id, oao.oposicion_id::text AS oposicion_id, oao.anio
         FROM preguntas_anios_oficiales pao
         JOIN oposiciones_anios_oficiales oao ON oao.id = pao.oposicion_anio_id
        WHERE pao.pregunta_id = $1 ORDER BY oao.anio DESC`,
      [preguntaId],
    );
    return result.rows;
  },

  async listForPregunta(preguntaId) {
    const result = await pool.query(
      `SELECT ${examFields}, eop.orden
         FROM examenes_oficiales_preguntas eop
         JOIN examenes_oficiales eo ON eo.id = eop.examen_id
        WHERE eop.pregunta_id = $1
        ORDER BY eo.anio DESC, eo.nombre`,
      [preguntaId],
    );
    return result.rows;
  },

  async listForOposicion({ oposicionId, anio = null, anioIds = [] } = {}) {
    const args = [oposicionId];
    const where = ['eo.oposicion_id = $1'];
    if (anio != null) { args.push(anio); where.push(`eo.anio = $${args.length}`); }
    if (anioIds.length) { args.push(anioIds); where.push(`eo.oposicion_anio_id = ANY($${args.length}::bigint[])`); }
    const result = await pool.query(
      `SELECT ${examFields}
         FROM examenes_oficiales eo
        WHERE ${where.join(' AND ')}
        ORDER BY eo.anio DESC, eo.nombre ASC`,
      args,
    );
    return result.rows;
  },

  async getPreguntaOposicionId(preguntaId) {
    const result = await pool.query(
      `SELECT t.oposicion_id::text AS oposicion_id
         FROM preguntas p JOIN temas t ON t.id = p.tema_id
        WHERE p.id = $1`,
      [preguntaId],
    );
    return result.rows[0]?.oposicion_id ?? null;
  },

  async setYearsForPreguntaWithClient(client, preguntaId, yearIds) {
    await client.query('DELETE FROM preguntas_anios_oficiales WHERE pregunta_id = $1', [preguntaId]);
    for (const yearId of yearIds) {
      await client.query(
        'INSERT INTO preguntas_anios_oficiales (pregunta_id, oposicion_anio_id) VALUES ($1, $2)',
        [preguntaId, yearId],
      );
    }
  },

  async setYearsForPregunta(preguntaId, yearIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await this.setYearsForPreguntaWithClient(client, preguntaId, yearIds);
      await client.query('COMMIT');
      return this.listYearsForPregunta(preguntaId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  },

  async list({ oposicionId = null, anio = null, preguntaId = null } = {}) {
    const args = [];
    const where = [];
    if (oposicionId != null) { args.push(oposicionId); where.push(`eo.oposicion_id = $${args.length}`); }
    if (anio != null) { args.push(anio); where.push(`eo.anio = $${args.length}`); }
    if (preguntaId != null) {
      args.push(preguntaId);
      where.push(`EXISTS (SELECT 1 FROM examenes_oficiales_preguntas x WHERE x.examen_id = eo.id AND x.pregunta_id = $${args.length})`);
    }
    const result = await pool.query(
      `SELECT ${examFields}, COUNT(eop.pregunta_id)::int AS total_preguntas
       FROM examenes_oficiales eo
       LEFT JOIN examenes_oficiales_preguntas eop ON eop.examen_id = eo.id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       GROUP BY eo.id ORDER BY eo.anio DESC, eo.nombre ASC`,
      args,
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`SELECT ${examFields} FROM examenes_oficiales eo WHERE eo.id = $1`, [id]);
    if (!result.rows[0]) return null;
    const questions = await pool.query(
      `SELECT eop.pregunta_id::text AS pregunta_id, eop.orden
         FROM examenes_oficiales_preguntas eop
        WHERE eop.examen_id = $1 ORDER BY eop.orden NULLS LAST, eop.pregunta_id`,
      [id],
    );
    return { ...result.rows[0], preguntas: questions.rows };
  },

  async create({ oposicionId, nombre, anio, convocatoria = null, fecha = null }) {
    const result = await pool.query(
      `INSERT INTO examenes_oficiales (oposicion_id, oposicion_anio_id, nombre, anio, convocatoria, fecha)
       SELECT $1, oao.id, $2, oao.anio, $4, $5
         FROM oposiciones_anios_oficiales oao
        WHERE oao.oposicion_id = $1 AND oao.anio = $3
       ON CONFLICT (oposicion_id, anio, lower(nombre), (coalesce(lower(convocatoria), '')))
       DO UPDATE SET nombre = examenes_oficiales.nombre
       RETURNING id::text AS id, oposicion_id::text AS oposicion_id,
                 oposicion_anio_id::text AS oposicion_anio_id,
                 nombre, anio, convocatoria, fecha`,
      [oposicionId, nombre, anio, convocatoria, fecha],
    );
    if (!result.rows[0]) return null;
    return result.rows[0];
  },

  async update(id, fields) {
    const result = await pool.query(
      `UPDATE examenes_oficiales
          SET nombre = COALESCE($2, nombre), anio = COALESCE($3, anio),
              convocatoria = CASE WHEN $4::boolean THEN $5 ELSE convocatoria END,
              fecha = CASE WHEN $6::boolean THEN $7 ELSE fecha END
        WHERE id = $1 RETURNING id::text AS id, oposicion_id::text AS oposicion_id,
                              nombre, anio, convocatoria, fecha`,
      [id, fields.nombre ?? null, fields.anio ?? null,
        Object.prototype.hasOwnProperty.call(fields, 'convocatoria'), fields.convocatoria ?? null,
        Object.prototype.hasOwnProperty.call(fields, 'fecha'), fields.fecha ?? null],
    );
    return result.rows[0] ?? null;
  },

  async remove(id) {
    const result = await pool.query('DELETE FROM examenes_oficiales WHERE id = $1 RETURNING id::text AS id', [id]);
    return result.rows[0] ?? null;
  },

  async attach(examenId, preguntaIds, ordenes = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM examenes_oficiales_preguntas WHERE examen_id = $1', [examenId]);
      for (const [index, preguntaId] of preguntaIds.entries()) {
        await client.query(
          `INSERT INTO examenes_oficiales_preguntas (examen_id, pregunta_id, orden)
           VALUES ($1, $2, $3)`,
          [examenId, preguntaId, ordenes[index] ?? null],
        );
      }
      await client.query('COMMIT');
      return this.getById(examenId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  },

  async setForPreguntaWithClient(client, preguntaId, examenIds) {
    await client.query('DELETE FROM examenes_oficiales_preguntas WHERE pregunta_id = $1', [preguntaId]);
    for (const examenId of examenIds) {
      await client.query(
        `INSERT INTO examenes_oficiales_preguntas (examen_id, pregunta_id)
         VALUES ($1, $2)`,
        [examenId, preguntaId],
      );
    }
  },

  async setForPregunta(preguntaId, examenIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await this.setForPreguntaWithClient(client, preguntaId, examenIds);
      await client.query('COMMIT');
      return this.listForPregunta(preguntaId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  },

  async yearsForOposicion(oposicionId) {
    const result = await pool.query(
      `SELECT id::text AS id, oposicion_id::text AS oposicion_id, anio
         FROM oposiciones_anios_oficiales
        WHERE oposicion_id = $1 ORDER BY anio DESC`,
      [oposicionId],
    );
    return result.rows;
  },
};
