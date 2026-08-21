import pool from '../config/db.js';

export const adminPreguntasEntityReadRepository = {
  async getPreguntaById(client, preguntaId) {
    const result = await client.query('SELECT id FROM preguntas WHERE id = $1', [preguntaId]);
    return result.rows[0] ?? null;
  },

  async getFullPreguntaById(preguntaId) {
    const pregResult = await pool.query(
      `SELECT p.id, p.tema_id, p.bloque_id, p.enunciado, p.explicacion,
              p.referencia_normativa, p.nivel_dificultad, p.estado,
              p.imagen_url, p.audio_url, p.fecha_actualizacion,
              t.oposicion_id,
              COALESCE((SELECT json_agg(json_build_object(
                'id', eo.id::text, 'nombre', eo.nombre, 'anio', eo.anio,
                'convocatoria', eo.convocatoria, 'fecha', eo.fecha, 'orden', eop.orden
              ) ORDER BY eo.anio DESC, eo.nombre)
                FROM examenes_oficiales_preguntas eop
                JOIN examenes_oficiales eo ON eo.id = eop.examen_id
               WHERE eop.pregunta_id = p.id), '[]'::json) AS examenes_oficiales
              ,COALESCE((SELECT json_agg(json_build_object(
                'id', oao.id::text, 'oposicion_id', oao.oposicion_id::text, 'anio', oao.anio
              ) ORDER BY oao.anio DESC)
                FROM preguntas_anios_oficiales pao
                JOIN oposiciones_anios_oficiales oao ON oao.id = pao.oposicion_anio_id
               WHERE pao.pregunta_id = p.id), '[]'::json) AS anios_oficiales
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
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

  async existsTema(temaId) {
    const result = await pool.query('SELECT id FROM temas WHERE id = $1', [temaId]);
    return result.rowCount > 0;
  },
};
