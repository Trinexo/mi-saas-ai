import pool from '../config/db.js';

export const simulacrosPublicosRepository = {
  /**
   * Simulacros publicados accesibles para el alumno.
   * Se filtran por las oposiciones a las que el usuario tiene acceso.
   * Se ordenan por fecha_publicacion ASC (el más próximo primero).
   */
  async getPublicados(oposicionIds) {
    if (!oposicionIds || oposicionIds.length === 0) return [];

    const rows = await pool.query(
      `SELECT
         s.id,
         s.nombre,
         s.descripcion,
         s.tiempo_limite_segundos,
         s.puntuacion_maxima,
         s.penalizacion,
         s.mostrar_resultados_al_final,
         s.fecha_publicacion,
         s.oposicion_id,
         o.nombre                                          AS oposicion_nombre,
         COALESCE(SUM(sb.numero_preguntas), 0)::int        AS total_preguntas
       FROM simulacros s
       LEFT JOIN oposiciones o       ON o.id = s.oposicion_id
       LEFT JOIN simulacros_bloques sb ON sb.simulacro_id = s.id
       WHERE s.estado = 'publicado'
         AND s.oposicion_id = ANY($1::bigint[])
       GROUP BY s.id, o.nombre
       ORDER BY s.fecha_publicacion ASC NULLS LAST, s.fecha_creacion ASC`,
      [oposicionIds],
    );
    return rows.rows;
  },

  /**
   * Carga todas las preguntas de un simulacro publicado, en orden de bloque y posición.
   * Devuelve null si el simulacro no existe o no está publicado.
   */
  async getPreguntasSimulacro(simulacroId) {
    const check = await pool.query(
      `SELECT id, oposicion_id, tiempo_limite_segundos, penalizacion, mostrar_resultados_al_final
       FROM simulacros WHERE id = $1 AND estado = 'publicado'`,
      [simulacroId],
    );
    if (check.rows.length === 0) return null;

    const rows = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad,
              p.imagen_url, p.audio_url,
              json_agg(
                json_build_object(
                  'id', po.id,
                  'texto', po.texto,
                  'esCorrecta', po.correcta
                ) ORDER BY po.id
              ) AS opciones
       FROM simulacros_bloques sb
       JOIN simulacros_preguntas sp ON sp.bloque_id = sb.id
       JOIN preguntas p             ON p.id = sp.pregunta_id
       JOIN opciones_respuesta po   ON po.pregunta_id = p.id
       WHERE sb.simulacro_id = $1
       GROUP BY p.id, sb.orden, sp.orden
       ORDER BY sb.orden, sp.orden`,
      [simulacroId],
    );

    return {
      simulacro: check.rows[0],
      preguntas: rows.rows,
    };
  },
};
