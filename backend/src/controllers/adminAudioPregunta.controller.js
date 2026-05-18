import { ok } from '../utils/response.js';
import { ApiError } from '../utils/api-error.js';
import { uploadAudioMiddleware, guardarAudioPregunta, eliminarAudioPorUrl } from '../services/uploadAudio.service.js';
import pool from '../config/db.js';

/**
 * Obtiene la jerarquía (oposicion_id, tema_id) de una pregunta.
 */
async function getPreguntaHierarquia(preguntaId) {
  const result = await pool.query(
    `SELECT p.tema_id, t.oposicion_id, p.audio_url
     FROM preguntas p
     JOIN temas t ON t.id = p.tema_id
     WHERE p.id = $1`,
    [preguntaId],
  );
  return result.rows[0] ?? null;
}

async function ensureCanManagePreguntaMedia(req, oposicionId) {
  if (req.user.role !== 'profesor') return;

  const result = await pool.query(
    'SELECT 1 FROM profesores_oposiciones WHERE user_id = $1 AND oposicion_id = $2 LIMIT 1',
    [req.user.userId, oposicionId],
  );

  if (result.rowCount === 0) {
    throw new ApiError(403, 'No puedes gestionar medios de una oposicion no asignada');
  }
}

/**
 * POST /api/admin/preguntas/:id/audio
 * Guarda el audio grabado y lo asocia a la pregunta.
 * La grabación del navegador ya llega comprimida en Opus (~32 kbps).
 */
export const uploadAudioPregunta = (req, res, next) => {
  uploadAudioMiddleware(req, res, async (err) => {
    if (err) return next(err);
    try {
      if (!req.file) throw new ApiError(400, 'No se ha enviado ningún audio');

      const preguntaId = Number(req.params.id);
      const hierarquia = await getPreguntaHierarquia(preguntaId);
      if (!hierarquia) throw new ApiError(404, 'Pregunta no encontrada');

      const { tema_id, oposicion_id, audio_url: urlAnterior } = hierarquia;
      await ensureCanManagePreguntaMedia(req, oposicion_id);

      // Borrar audio anterior si existía
      if (urlAnterior) eliminarAudioPorUrl(urlAnterior);

      const audioUrl = guardarAudioPregunta(
        req.file.buffer,
        req.file.mimetype,
        preguntaId,
        oposicion_id,
        tema_id,
      );

      await pool.query(
        'UPDATE preguntas SET audio_url = $1, fecha_actualizacion = NOW() WHERE id = $2',
        [audioUrl, preguntaId],
      );

      return ok(res, { audioUrl }, 'Audio guardado correctamente');
    } catch (error) {
      return next(error);
    }
  });
};

/**
 * DELETE /api/admin/preguntas/:id/audio
 * Elimina el audio de la pregunta.
 */
export const deleteAudioPregunta = async (req, res, next) => {
  try {
    const preguntaId = Number(req.params.id);

    const check = await pool.query(
      `SELECT p.audio_url, t.oposicion_id
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       WHERE p.id = $1`,
      [preguntaId],
    );
    if (check.rowCount === 0) throw new ApiError(404, 'Pregunta no encontrada');
    await ensureCanManagePreguntaMedia(req, check.rows[0].oposicion_id);

    eliminarAudioPorUrl(check.rows[0]?.audio_url);

    await pool.query(
      'UPDATE preguntas SET audio_url = NULL, fecha_actualizacion = NOW() WHERE id = $1',
      [preguntaId],
    );

    return ok(res, null, 'Audio eliminado');
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/media/audios
 * Devuelve árbol de audios subidos, agrupados por oposición > tema.
 * Los profesores solo ven sus oposiciones asignadas.
 */
export const getAudioBrowser = async (req, res, next) => {
  try {
    const { role, userId } = req.user;

    let filterOposiciones = null;
    if (role === 'profesor') {
      const assigned = await pool.query(
        'SELECT oposicion_id FROM profesores_oposiciones WHERE user_id = $1',
        [userId],
      );
      filterOposiciones = assigned.rows.map((r) => r.oposicion_id);
      if (filterOposiciones.length === 0) return ok(res, []);
    }

    const whereClause = filterOposiciones
      ? 'WHERE p.audio_url IS NOT NULL AND t.oposicion_id = ANY($1)'
      : 'WHERE p.audio_url IS NOT NULL';
    const params = filterOposiciones ? [filterOposiciones] : [];

    const result = await pool.query(
      `SELECT p.id AS pregunta_id,
              LEFT(p.enunciado, 80) AS enunciado,
              p.audio_url,
              t.id   AS tema_id,      t.nombre AS tema_nombre,
              o.id   AS oposicion_id, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN temas   t  ON t.id  = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       ${whereClause}
       ORDER BY o.nombre, t.nombre, p.id`,
      params,
    );

    // Agrupar en árbol oposicion → tema → audios
    const tree = [];
    const oposMap = new Map();

    for (const row of result.rows) {
      if (!oposMap.has(row.oposicion_id)) {
        const node = { oposicionId: row.oposicion_id, oposicionNombre: row.oposicion_nombre, temas: [] };
        oposMap.set(row.oposicion_id, node);
        tree.push(node);
      }
      const oposNode = oposMap.get(row.oposicion_id);
      let temaNode = oposNode.temas.find((t) => t.temaId === row.tema_id);
      if (!temaNode) {
        temaNode = { temaId: row.tema_id, temaNombre: row.tema_nombre, audios: [] };
        oposNode.temas.push(temaNode);
      }
      temaNode.audios.push({
        preguntaId: Number(row.pregunta_id),
        audioUrl: row.audio_url,
        enunciado: row.enunciado,
      });
    }

    return ok(res, tree);
  } catch (error) {
    return next(error);
  }
};
