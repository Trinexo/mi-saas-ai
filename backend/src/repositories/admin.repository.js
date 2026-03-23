import pool from '../config/db.js';

const buildWhere = (filters, args) => {
  const where = [];

  if (filters.oposicionId) {
    args.push(filters.oposicionId);
    where.push(`m.oposicion_id = $${args.length}`);
  }
  if (filters.materiaId) {
    args.push(filters.materiaId);
    where.push(`t.materia_id = $${args.length}`);
  }
  if (filters.temaId) {
    args.push(filters.temaId);
    where.push(`p.tema_id = $${args.length}`);
  }
  if (filters.nivelDificultad) {
    args.push(filters.nivelDificultad);
    where.push(`p.nivel_dificultad = $${args.length}`);
  }

  return where.length ? `WHERE ${where.join(' AND ')}` : '';
};

export const adminRepository = {
  async listPreguntas(filters, limit, offset) {
    const args = [];
    const where = buildWhere(filters, args);
    args.push(limit, offset);

    const result = await pool.query(
      `SELECT p.id, p.tema_id, p.enunciado, p.nivel_dificultad,
              t.nombre AS tema_nombre,
              m.nombre AS materia_nombre,
              o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       ${where}
       ORDER BY p.id DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    return result.rows;
  },

  async countPreguntas(filters) {
    const args = [];
    const where = buildWhere(filters, args);

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       ${where}`,
      args,
    );

    return result.rows[0].total;
  },

  async createPregunta(client, payload) {
    const result = await client.query(
      `INSERT INTO preguntas (tema_id, enunciado, explicacion, referencia_normativa, nivel_dificultad, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        payload.temaId,
        payload.enunciado,
        payload.explicacion,
        payload.referenciaNormativa ?? null,
        payload.nivelDificultad,
        payload.estado ?? 'aprobada',
      ],
    );

    return result.rows[0];
  },

  async createOpciones(client, preguntaId, opciones) {
    for (const opcion of opciones) {
      await client.query(
        `INSERT INTO opciones_respuesta (pregunta_id, texto, correcta)
         VALUES ($1, $2, $3)`,
        [preguntaId, opcion.texto, opcion.correcta],
      );
    }
  },

  async getPreguntaById(client, preguntaId) {
    const result = await client.query('SELECT id FROM preguntas WHERE id = $1', [preguntaId]);
    return result.rows[0] ?? null;
  },

  async getFullPreguntaById(preguntaId) {
    const pregResult = await pool.query(
      `SELECT p.id, p.tema_id, p.enunciado, p.explicacion,
              p.referencia_normativa, p.nivel_dificultad,
              t.materia_id, m.oposicion_id
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       WHERE p.id = $1`,
      [preguntaId],
    );
    if (!pregResult.rows[0]) return null;
    const opResult = await pool.query(
      'SELECT id, texto, correcta FROM opciones_respuesta WHERE pregunta_id = $1 ORDER BY id',
      [preguntaId],
    );
    return { ...pregResult.rows[0], opciones: opResult.rows };
  },

  async updatePregunta(client, preguntaId, payload) {
    await client.query(
      `UPDATE preguntas
       SET tema_id = $2,
           enunciado = $3,
           explicacion = $4,
           referencia_normativa = $5,
           nivel_dificultad = $6,
           fecha_actualizacion = NOW()
       WHERE id = $1`,
      [
        preguntaId,
        payload.temaId,
        payload.enunciado,
        payload.explicacion,
        payload.referenciaNormativa ?? null,
        payload.nivelDificultad,
      ],
    );
  },

  async deleteOpciones(client, preguntaId) {
    await client.query('DELETE FROM opciones_respuesta WHERE pregunta_id = $1', [preguntaId]);
  },

  async deletePregunta(preguntaId) {
    const result = await pool.query('DELETE FROM preguntas WHERE id = $1 RETURNING id', [preguntaId]);
    return result.rowCount > 0;
  },

  async existsTema(temaId) {
    const result = await pool.query('SELECT id FROM temas WHERE id = $1', [temaId]);
    return result.rowCount > 0;
  },

  async listReportes(filters, limit, offset) {
    const args = [];
    const where = [];

    if (filters.estado) {
      args.push(filters.estado);
      where.push(`rp.estado = $${args.length}`);
    }

    args.push(limit, offset);

    const result = await pool.query(
      `SELECT rp.id,
              rp.pregunta_id,
              rp.usuario_id,
              rp.motivo,
              rp.estado,
              rp.fecha_creacion,
              p.enunciado AS pregunta_enunciado,
              u.email AS usuario_email
       FROM reportes_preguntas rp
       JOIN preguntas p ON p.id = rp.pregunta_id
       JOIN usuarios u ON u.id = rp.usuario_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY rp.fecha_creacion DESC, rp.id DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    return result.rows;
  },

  async countReportes(filters) {
    const args = [];
    const where = [];

    if (filters.estado) {
      args.push(filters.estado);
      where.push(`estado = $${args.length}`);
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM reportes_preguntas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      args,
    );

    return result.rows[0].total;
  },

  async updateReporteEstado(reporteId, estado) {
    const result = await pool.query(
      `UPDATE reportes_preguntas
       SET estado = $2
       WHERE id = $1
       RETURNING id`,
      [reporteId, estado],
    );

    return result.rowCount > 0;
  },

  async insertAuditoria({ accion, preguntaId, userId, userRole, datosAnteriores = null }) {
    await pool.query(
      `INSERT INTO auditoria_preguntas (accion, pregunta_id, usuario_id, usuario_role, datos_anteriores)
       VALUES ($1, $2, $3, $4, $5)`,
      [accion, preguntaId, userId, userRole, datosAnteriores ? JSON.stringify(datosAnteriores) : null],
    );
  },

  async listAuditoria({ page, pageSize, preguntaId, usuarioId, accion }) {
    const args = [];
    const where = [];

    if (preguntaId) {
      args.push(preguntaId);
      where.push(`pregunta_id = $${args.length}`);
    }
    if (usuarioId) {
      args.push(usuarioId);
      where.push(`usuario_id = $${args.length}`);
    }
    if (accion) {
      args.push(accion);
      where.push(`accion = $${args.length}`);
    }

    const offset = (page - 1) * pageSize;
    args.push(pageSize, offset);

    const result = await pool.query(
      `SELECT id, accion, pregunta_id, usuario_id, usuario_role, fecha, datos_anteriores
       FROM auditoria_preguntas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY fecha DESC, id DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    return result.rows;
  },

  async countAuditoria({ preguntaId, usuarioId, accion }) {
    const args = [];
    const where = [];

    if (preguntaId) {
      args.push(preguntaId);
      where.push(`pregunta_id = $${args.length}`);
    }
    if (usuarioId) {
      args.push(usuarioId);
      where.push(`usuario_id = $${args.length}`);
    }
    if (accion) {
      args.push(accion);
      where.push(`accion = $${args.length}`);
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM auditoria_preguntas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      args,
    );

    return result.rows[0].total;
  },

  async getAdminStats() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM preguntas)                                      AS total_preguntas,
        (SELECT COUNT(*)::int FROM preguntas WHERE estado = 'pendiente')           AS pendientes_revision,
        (SELECT COUNT(*)::int FROM usuarios)                                       AS total_usuarios,
        (SELECT COUNT(*)::int FROM tests WHERE estado = 'completado')              AS total_tests,
        (SELECT COUNT(*)::int FROM tests
          WHERE estado = 'completado'
            AND created_at >= NOW() - INTERVAL '7 days')                          AS tests_esta_semana,
        (SELECT ROUND(AVG(nota_total)::numeric, 2)
          FROM tests WHERE estado = 'completado')                                  AS nota_media_global
    `);
    const row = result.rows[0];
    return {
      totalPreguntas: row.total_preguntas,
      pendientesRevision: row.pendientes_revision,
      totalUsuarios: row.total_usuarios,
      totalTests: row.total_tests,
      testsEstaSemana: row.tests_esta_semana,
      notaMediaGlobal: row.nota_media_global !== null ? Number(row.nota_media_global) : null,
    };
  },

  async listUsers({ role, q }, limit, offset) {
    const args = [];
    const where = [];

    if (role) {
      args.push(role);
      where.push(`u.role = $${args.length}`);
    }
    if (q) {
      args.push(`%${q}%`);
      where.push(`(u.nombre ILIKE $${args.length} OR u.email ILIKE $${args.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    args.push(limit, offset);

    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.role, u.fecha_registro
       FROM usuarios u
       ${whereClause}
       ORDER BY u.fecha_registro DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    const countArgs = args.slice(0, args.length - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM usuarios u ${whereClause}`,
      countArgs,
    );

    return { rows: result.rows, total: countResult.rows[0].total };
  },

  async updateUserRole(userId, role) {
    const result = await pool.query(
      `UPDATE usuarios SET role = $2 WHERE id = $1 RETURNING id, nombre, email, role`,
      [userId, role],
    );
    return result.rows[0] ?? null;
  },

  async getTemasConMasErrores(limit) {
    const result = await pool.query(
      `SELECT
         t.id            AS tema_id,
         t.nombre        AS tema_nombre,
         m.nombre        AS materia_nombre,
         COUNT(*)::int   AS total_respuestas,
         SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::int  AS total_errores,
         ROUND(
           SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::numeric
           / NULLIF(COUNT(*), 0) * 100, 1
         ) AS pct_error
       FROM respuestas_usuario ru
       JOIN preguntas p ON p.id = ru.pregunta_id
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       WHERE ru.correcta IS NOT NULL
       GROUP BY t.id, t.nombre, m.nombre
       HAVING COUNT(*) >= 10
       ORDER BY total_errores DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((r) => ({
      temaId: r.tema_id,
      temaNombre: r.tema_nombre,
      materiaNombre: r.materia_nombre,
      totalRespuestas: r.total_respuestas,
      totalErrores: r.total_errores,
      pctError: r.pct_error !== null ? Number(r.pct_error) : null,
    }));
  },
};