import pool from '../config/db.js';

export const albacerProgressRepository = {
  async getFinalAttemptContext(userId, testId) {
    const result = await pool.query(
      `SELECT
         t.id AS test_id,
         t.usuario_id,
         t.albacer_modulo_id,
         t.albacer_item_id,
         t.numero_preguntas,
         mi.tipo AS item_tipo,
         mi.simulacro_id,
         s.criterio_superacion,
         s.valor_superacion,
         s.oposicion_id
       FROM tests t
       JOIN albacer_modulo_items mi ON mi.id = t.albacer_item_id
       JOIN simulacros s ON s.id = mi.simulacro_id
       WHERE t.id = $1
         AND t.usuario_id = $2
         AND t.modo_preparacion = 'albacer'
         AND mi.tipo = 'simulacro_final'
         AND t.albacer_modulo_id IS NOT NULL
       LIMIT 1`,
      [testId, userId],
    );
    return result.rows[0] ?? null;
  },

  async upsertFinalAttemptProgress({
    userId,
    moduloId,
    testId,
    nota,
    porcentaje,
    superado,
  }) {
    const result = await pool.query(
      `INSERT INTO albacer_modulo_progreso
         (usuario_id, modulo_id, estado, mejor_nota, mejor_porcentaje, test_id_mejor_intento, superado_en)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7 THEN NOW() ELSE NULL END)
       ON CONFLICT (usuario_id, modulo_id)
       DO UPDATE SET
         mejor_nota = GREATEST(
           COALESCE(albacer_modulo_progreso.mejor_nota, -999),
           EXCLUDED.mejor_nota
         ),
         mejor_porcentaje = GREATEST(
           COALESCE(albacer_modulo_progreso.mejor_porcentaje, -999),
           EXCLUDED.mejor_porcentaje
         ),
         test_id_mejor_intento = CASE
           WHEN EXCLUDED.mejor_nota >= COALESCE(albacer_modulo_progreso.mejor_nota, -999)
           THEN EXCLUDED.test_id_mejor_intento
           ELSE albacer_modulo_progreso.test_id_mejor_intento
         END,
         estado = CASE
           WHEN $7 THEN 'superado'
           WHEN albacer_modulo_progreso.estado = 'superado' THEN 'superado'
           ELSE 'disponible'
         END,
         superado_en = CASE
           WHEN $7 AND albacer_modulo_progreso.superado_en IS NULL THEN NOW()
           ELSE albacer_modulo_progreso.superado_en
         END,
         actualizado_en = NOW()
       RETURNING *`,
      [
        userId,
        moduloId,
        superado ? 'superado' : 'disponible',
        nota,
        porcentaje,
        testId,
        superado,
      ],
    );
    return result.rows[0] ?? null;
  },

  async unlockNextModulo(userId, moduloId) {
    const result = await pool.query(
      `WITH current_modulo AS (
         SELECT oposicion_id, orden, id
         FROM albacer_modulos
         WHERE id = $2
       ),
       next_modulo AS (
         SELECT m.id
         FROM albacer_modulos m
         JOIN current_modulo cm ON cm.oposicion_id = m.oposicion_id
         WHERE m.estado = 'publicado'
           AND (m.orden, m.id) > (cm.orden, cm.id)
         ORDER BY m.orden, m.id
         LIMIT 1
       )
       INSERT INTO albacer_modulo_progreso (usuario_id, modulo_id, estado)
       SELECT $1, id, 'disponible'
       FROM next_modulo
       ON CONFLICT (usuario_id, modulo_id)
       DO UPDATE SET
         estado = CASE
           WHEN albacer_modulo_progreso.estado = 'bloqueado' THEN 'disponible'
           ELSE albacer_modulo_progreso.estado
         END,
         actualizado_en = NOW()
       RETURNING modulo_id`,
      [userId, moduloId],
    );
    return result.rows[0]?.modulo_id ? Number(result.rows[0].modulo_id) : null;
  },
};
