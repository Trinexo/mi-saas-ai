import pool from '../config/db.js';

export const testPendientesService = {
  async getPendientes(userId, oposicionId = null, modoPreparacion = null) {
    const res = await pool.query(
      `SELECT t.id,
              t.numero_preguntas,
              t.tipo_test,
              t.fecha_creacion,
              t.oposicion_id,
              op.nombre AS oposicion_nombre,
              te.nombre AS tema_nombre,
              COUNT(ru.id)::int AS respondidas
       FROM tests t
       LEFT JOIN oposiciones          op ON op.id = t.oposicion_id
       LEFT JOIN temas                te ON te.id = t.tema_id
       LEFT JOIN respuestas_usuario   ru ON ru.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'generado'
         AND ($2::bigint IS NULL OR t.oposicion_id = $2)
         AND ($3::text IS NULL OR t.modo_preparacion = $3)
       GROUP BY t.id, t.oposicion_id, op.nombre, te.nombre
       ORDER BY t.fecha_creacion DESC`,
      [userId, oposicionId, modoPreparacion],
    );

    return res.rows.map((r) => ({
      id:              Number(r.id),
      numeroPreguntas: Number(r.numero_preguntas),
      tipoTest:        r.tipo_test,
      fechaCreacion:   r.fecha_creacion,
      oposicionId:     r.oposicion_id ? Number(r.oposicion_id) : null,
      oposicionNombre: r.oposicion_nombre ?? null,
      temaNombre:      r.tema_nombre ?? null,
      respondidas:     r.respondidas,
    }));
  },

  async cerrar(userId, testId) {
    const res = await pool.query(
      `UPDATE tests
          SET estado = 'finalizado', fecha_fin = NOW()
        WHERE id = $1 AND usuario_id = $2
        RETURNING id`,
      [testId, userId],
    );
    if (res.rowCount === 0) {
      const err = new Error('Test no encontrado o no autorizado');
      err.statusCode = 404;
      throw err;
    }
    return { id: testId };
  },
};
