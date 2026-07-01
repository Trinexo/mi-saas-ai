import pool from '../config/db.js';

const mapItem = (row) => ({
  id: Number(row.id),
  modulo_id: Number(row.modulo_id),
  tipo: row.tipo,
  titulo: row.titulo,
  descripcion: row.descripcion,
  plantilla_test_id: row.plantilla_test_id == null ? null : Number(row.plantilla_test_id),
  simulacro_id: row.simulacro_id == null ? null : Number(row.simulacro_id),
  orden: Number(row.orden ?? 0),
  obligatorio: Boolean(row.obligatorio),
  total_preguntas: Number(row.total_preguntas ?? 0),
  duracion_segundos: row.duracion_segundos == null ? null : Number(row.duracion_segundos),
  estado_contenido: row.estado_contenido ?? null,
});

const mapModulo = (row) => ({
  id: Number(row.id),
  oposicion_id: Number(row.oposicion_id),
  nombre: row.nombre,
  descripcion: row.descripcion,
  orden: Number(row.orden ?? 0),
  estado: row.estado,
  temas: Array.isArray(row.temas) ? row.temas : [],
  progreso: {
    estado: row.progreso_estado ?? null,
    mejor_nota: row.mejor_nota == null ? null : Number(row.mejor_nota),
    mejor_porcentaje: row.mejor_porcentaje == null ? null : Number(row.mejor_porcentaje),
    test_id_mejor_intento: row.test_id_mejor_intento == null ? null : Number(row.test_id_mejor_intento),
    superado_en: row.superado_en ?? null,
  },
  items: Array.isArray(row.items) ? row.items.map(mapItem) : [],
});

export const albacerAlumnoRepository = {
  async getAcceso(userId, oposicionId) {
    const result = await pool.query(
      `SELECT usuario_id, oposicion_id, estado, tipo_alumno, modo_preparacion
       FROM accesos_oposicion
       WHERE usuario_id = $1
         AND oposicion_id = $2
         AND estado = 'activo'
       LIMIT 1`,
      [userId, oposicionId],
    );
    return result.rows[0] ?? null;
  },

  async listModulos(userId, oposicionId) {
    const result = await pool.query(
      `SELECT
         m.*,
         mp.estado AS progreso_estado,
         mp.mejor_nota,
         mp.mejor_porcentaje,
         mp.test_id_mejor_intento,
         mp.superado_en,
         COALESCE(temas.temas, '[]'::json) AS temas,
         COALESCE(items.items, '[]'::json) AS items
       FROM albacer_modulos m
       LEFT JOIN albacer_modulo_progreso mp
         ON mp.modulo_id = m.id
        AND mp.usuario_id = $1
       LEFT JOIN LATERAL (
         SELECT json_agg(json_build_object('id', te.id, 'nombre', te.nombre) ORDER BY te.nombre, te.id) AS temas
         FROM albacer_modulo_temas mt
         JOIN temas te ON te.id = mt.tema_id
         WHERE mt.modulo_id = m.id
       ) temas ON TRUE
       LEFT JOIN LATERAL (
         SELECT json_agg(
           json_build_object(
             'id', mi.id,
             'modulo_id', mi.modulo_id,
             'tipo', mi.tipo,
             'titulo', mi.titulo,
             'descripcion', mi.descripcion,
             'plantilla_test_id', mi.plantilla_test_id,
             'simulacro_id', mi.simulacro_id,
             'orden', mi.orden,
             'obligatorio', mi.obligatorio,
             'estado_contenido', COALESCE(at.estado, s.estado),
             'total_preguntas', CASE
               WHEN mi.tipo = 'simulacro_final' THEN COALESCE(sim_q.total_preguntas, 0)
               ELSE COALESCE(test_q.total_preguntas, 0)
             END,
             'duracion_segundos', COALESCE(at.duracion_minutos * 60, s.tiempo_limite_segundos)
           )
           ORDER BY mi.orden, mi.id
         ) AS items
         FROM albacer_modulo_items mi
         LEFT JOIN admin_tests at ON at.id = mi.plantilla_test_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS total_preguntas
           FROM admin_tests_preguntas atp
           WHERE atp.test_id = at.id
         ) test_q ON TRUE
         LEFT JOIN simulacros s ON s.id = mi.simulacro_id
         LEFT JOIN LATERAL (
           SELECT COUNT(sp.pregunta_id)::int AS total_preguntas
           FROM simulacros_bloques sb
           JOIN simulacros_preguntas sp ON sp.bloque_id = sb.id
           WHERE sb.simulacro_id = s.id
         ) sim_q ON TRUE
         WHERE mi.modulo_id = m.id
       ) items ON TRUE
       WHERE m.oposicion_id = $2
         AND m.estado = 'publicado'
       ORDER BY m.orden, m.id`,
      [userId, oposicionId],
    );
    return result.rows.map(mapModulo);
  },

  async getModuloForAlumno(userId, moduloId) {
    const result = await pool.query(
      `SELECT m.*
       FROM albacer_modulos m
       JOIN accesos_oposicion ao
         ON ao.oposicion_id = m.oposicion_id
        AND ao.usuario_id = $1
        AND ao.estado = 'activo'
       WHERE m.id = $2
         AND m.estado = 'publicado'
       LIMIT 1`,
      [userId, moduloId],
    );
    return result.rows[0] ?? null;
  },

  async getItemForAlumno(userId, itemId) {
    const result = await pool.query(
      `SELECT mi.*, m.oposicion_id, m.estado AS modulo_estado
       FROM albacer_modulo_items mi
       JOIN albacer_modulos m ON m.id = mi.modulo_id
       JOIN accesos_oposicion ao
         ON ao.oposicion_id = m.oposicion_id
        AND ao.usuario_id = $1
        AND ao.estado = 'activo'
       WHERE mi.id = $2
         AND m.estado = 'publicado'
       LIMIT 1`,
      [userId, itemId],
    );
    return result.rows[0] ?? null;
  },

  async getFinalItemForAlumno(userId, moduloId) {
    const result = await pool.query(
      `SELECT mi.*, m.oposicion_id, m.estado AS modulo_estado
       FROM albacer_modulo_items mi
       JOIN albacer_modulos m ON m.id = mi.modulo_id
       JOIN accesos_oposicion ao
         ON ao.oposicion_id = m.oposicion_id
        AND ao.usuario_id = $1
        AND ao.estado = 'activo'
       WHERE mi.modulo_id = $2
         AND mi.tipo = 'simulacro_final'
         AND m.estado = 'publicado'
       ORDER BY mi.orden, mi.id
       LIMIT 1`,
      [userId, moduloId],
    );
    return result.rows[0] ?? null;
  },

  async upsertModuloDisponible(userId, moduloId) {
    await pool.query(
      `INSERT INTO albacer_modulo_progreso (usuario_id, modulo_id, estado)
       VALUES ($1, $2, 'disponible')
       ON CONFLICT (usuario_id, modulo_id)
       DO UPDATE SET
         estado = CASE
           WHEN albacer_modulo_progreso.estado = 'bloqueado' THEN 'disponible'
           ELSE albacer_modulo_progreso.estado
         END,
         actualizado_en = NOW()`,
      [userId, moduloId],
    );
  },
};
