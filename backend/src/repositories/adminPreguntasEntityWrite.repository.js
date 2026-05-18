import pool from '../config/db.js';

export const adminPreguntasEntityWriteRepository = {
  async createPregunta(client, payload) {
    const result = await client.query(
      `INSERT INTO preguntas (tema_id, enunciado, explicacion, referencia_normativa, nivel_dificultad, imagen_url, audio_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        payload.temaId,
        payload.enunciado,
        payload.explicacion,
        payload.referenciaNormativa ?? null,
        payload.nivelDificultad,
        payload.imagenUrl ?? null,
        payload.audioUrl ?? null,
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

  async updateOpciones(client, preguntaId, opciones) {
    const existing = await client.query(
      'SELECT id FROM opciones_respuesta WHERE pregunta_id = $1 ORDER BY id',
      [preguntaId],
    );

    if (existing.rowCount !== opciones.length) {
      throw new Error('La pregunta no tiene el mismo número de opciones que el payload de edición');
    }

    for (const [index, opcion] of opciones.entries()) {
      await client.query(
        `UPDATE opciones_respuesta
         SET texto = $2,
             correcta = $3
         WHERE id = $1`,
        [existing.rows[index].id, opcion.texto, opcion.correcta],
      );
    }
  },

  async updatePregunta(client, preguntaId, payload) {
    await client.query(
      `UPDATE preguntas
       SET tema_id = $2,
           enunciado = $3,
           explicacion = $4,
           referencia_normativa = $5,
           nivel_dificultad = $6,
           imagen_url = COALESCE($7, imagen_url),
           audio_url = COALESCE($8, audio_url),
           fecha_actualizacion = NOW()
       WHERE id = $1`,
      [
        preguntaId,
        payload.temaId,
        payload.enunciado,
        payload.explicacion,
        payload.referenciaNormativa ?? null,
        payload.nivelDificultad,
        payload.imagenUrl ?? null,
        payload.audioUrl ?? null,
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

  async asignarColeccion(client, preguntaId, coleccionId) {
    await client.query(
      `INSERT INTO colecciones_preguntas (coleccion_id, pregunta_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [coleccionId, preguntaId],
    );
  },
};
