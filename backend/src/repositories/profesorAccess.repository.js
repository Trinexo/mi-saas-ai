import pool from '../config/db.js';

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const publicId = (value) => {
  if (value == null) return null;
  const bigint = BigInt(value);
  return bigint <= MAX_SAFE_BIGINT ? Number(bigint) : bigint.toString();
};

export const profesorAccessRepository = {
  async listAssignedOposicionIds(userId) {
    const result = await pool.query(
      'SELECT oposicion_id FROM profesores_oposiciones WHERE user_id = $1',
      [userId],
    );
    return result.rows.map((row) => publicId(row.oposicion_id));
  },

  async hasAssignedOposicion(userId, oposicionId) {
    const result = await pool.query(
      'SELECT 1 FROM profesores_oposiciones WHERE user_id = $1 AND oposicion_id = $2 LIMIT 1',
      [userId, oposicionId],
    );
    return result.rows.length > 0;
  },

  async hasAssignedBloque(userId, bloqueId) {
    const result = await pool.query(
      `SELECT 1
       FROM colecciones b
       JOIN temas t ON t.id = b.tema_id
       JOIN profesores_oposiciones po ON po.oposicion_id = t.oposicion_id
       WHERE po.user_id = $1 AND b.id = $2
       LIMIT 1`,
      [userId, bloqueId],
    );
    return result.rows.length > 0;
  },

  async hasAssignedTema(userId, temaId) {
    const result = await pool.query(
      `SELECT 1
       FROM temas t
       JOIN profesores_oposiciones po ON po.oposicion_id = t.oposicion_id
       WHERE po.user_id = $1 AND t.id = $2
       LIMIT 1`,
      [userId, temaId],
    );
    return result.rows.length > 0;
  },

  async getTemaOposicionId(temaId) {
    const result = await pool.query(
      'SELECT oposicion_id FROM temas WHERE id = $1',
      [temaId],
    );
    return result.rows[0]?.oposicion_id ? publicId(result.rows[0].oposicion_id) : null;
  },

  async hasAssignedPregunta(userId, preguntaId) {
    const result = await pool.query(
      `SELECT 1
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN profesores_oposiciones po ON po.oposicion_id = t.oposicion_id
       WHERE po.user_id = $1 AND p.id = $2
       LIMIT 1`,
      [userId, preguntaId],
    );
    return result.rows.length > 0;
  },

  async hasAssignedPlantillaTest(userId, plantillaTestId) {
    const result = await pool.query(
      `SELECT 1
       FROM admin_tests at
       JOIN profesores_oposiciones po ON po.oposicion_id = at.oposicion_id
       WHERE po.user_id = $1 AND at.id = $2
       LIMIT 1`,
      [userId, plantillaTestId],
    );
    return result.rows.length > 0;
  },

  async hasAssignedSimulacro(userId, simulacroId) {
    const result = await pool.query(
      `SELECT 1
       FROM simulacros s
       JOIN profesores_oposiciones po ON po.oposicion_id = s.oposicion_id
       WHERE po.user_id = $1 AND s.id = $2
       LIMIT 1`,
      [userId, simulacroId],
    );
    return result.rows.length > 0;
  },

  async canAccessAlumno(userId, alumnoId, oposicionId = null) {
    const { accessContextService, contextoEsOperativo } = await import('../services/accessContext.service.js');
    const oposiciones = oposicionId == null
      ? await this.listAssignedOposicionIds(userId)
      : [oposicionId];
    for (const assignedOposicionId of oposiciones) {
      const assigned = await this.hasAssignedOposicion(userId, assignedOposicionId);
      if (!assigned) continue;
      const [contexto] = await accessContextService.obtenerContextosUsuariosOposicion({
        usuarioIds: [alumnoId],
        oposicionId: assignedOposicionId,
        principal: { tipo: 'profesor', usuarioId: userId },
      });
      if (contextoEsOperativo(contexto, { permitirPendiente: true })) return true;
    }
    return false;
  },

  async resolveDeprecatedBloqueId(bloqueId) {
    const result = await pool.query(
      `SELECT b.id AS bloque_id, b.tema_id, t.oposicion_id
       FROM colecciones b
       JOIN temas t ON t.id = b.tema_id
       WHERE b.id = $1`,
      [bloqueId],
    );
    return result.rows[0] ?? null;
  },

  async getPreguntaOposicionIds(preguntaIds) {
    if (!preguntaIds?.length) return [];
    const result = await pool.query(
      `SELECT DISTINCT t.oposicion_id
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       WHERE p.id = ANY($1::bigint[])`,
      [preguntaIds],
    );
    return result.rows.map((row) => publicId(row.oposicion_id));
  },
};
