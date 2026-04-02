import pool from '../config/db.js';

export const testSessionHistoryRepository = {
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
};
