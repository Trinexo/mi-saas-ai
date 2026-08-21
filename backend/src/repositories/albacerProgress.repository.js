import pool from '../config/db.js';

export const albacerProgressRepository = {
  async getAttemptContext(userId, testId) {
    const result = await pool.query(
      `SELECT
         t.id AS test_id,
         t.usuario_id,
         t.albacer_modulo_id,
         t.albacer_item_id,
         t.numero_preguntas,
         mi.tipo AS item_tipo,
         mi.obligatorio,
         mi.simulacro_id,
         s.criterio_superacion,
         s.valor_superacion,
         s.oposicion_id
       FROM tests t
       JOIN albacer_modulo_items mi ON mi.id = t.albacer_item_id
       LEFT JOIN simulacros s ON s.id = mi.simulacro_id
       WHERE t.id = $1
         AND t.usuario_id = $2
         AND t.modo_preparacion = 'albacer'
         AND t.albacer_modulo_id IS NOT NULL
       LIMIT 1`,
      [testId, userId],
    );
    return result.rows[0] ?? null;
  },

  async refreshMandatoryItemProgress(userId, testId, client = pool) {
    const result = await client.query(
      `WITH target AS (
         SELECT t.albacer_item_id AS item_id
         FROM tests t
         JOIN albacer_modulo_items mi ON mi.id = t.albacer_item_id
         WHERE t.id = $2
           AND t.usuario_id = $1
           AND t.modo_preparacion = 'albacer'
           AND mi.tipo = 'test'
           AND mi.obligatorio = TRUE
       ), aggregate_progress AS (
         SELECT
           t.usuario_id,
           t.albacer_item_id AS item_id,
           COUNT(*)::int AS intentos,
           MAX(rt.nota) AS mejor_nota,
           (ARRAY_AGG(rt.nota ORDER BY rt.fecha DESC, rt.id DESC))[1] AS ultima_nota,
           (ARRAY_AGG(t.id ORDER BY rt.fecha DESC, rt.id DESC))[1] AS ultimo_test_id,
           (ARRAY_AGG(t.id ORDER BY rt.nota DESC, rt.fecha ASC, rt.id ASC))[1] AS test_id_mejor_intento,
           MIN(t.fecha_creacion) AS iniciado_en,
           BOOL_OR(rt.nota >= 5.00) AS superado,
           MIN(rt.fecha) FILTER (WHERE rt.nota >= 5.00) AS superado_en,
           MAX(rt.fecha) AS actualizado_en
         FROM tests t
         JOIN target target_item ON target_item.item_id = t.albacer_item_id
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.modo_preparacion = 'albacer'
         GROUP BY t.usuario_id, t.albacer_item_id
       )
       INSERT INTO albacer_item_progreso (
         usuario_id, item_id, intentos, superado, mejor_nota, ultima_nota,
         ultimo_test_id, test_id_mejor_intento, iniciado_en, superado_en, actualizado_en
       )
       SELECT
         usuario_id, item_id, intentos, superado, mejor_nota, ultima_nota,
         ultimo_test_id, test_id_mejor_intento, iniciado_en, superado_en, actualizado_en
       FROM aggregate_progress
       ON CONFLICT (usuario_id, item_id)
       DO UPDATE SET
         intentos = EXCLUDED.intentos,
         superado = albacer_item_progreso.superado OR EXCLUDED.superado,
         mejor_nota = GREATEST(albacer_item_progreso.mejor_nota, EXCLUDED.mejor_nota),
         ultima_nota = EXCLUDED.ultima_nota,
         ultimo_test_id = EXCLUDED.ultimo_test_id,
         test_id_mejor_intento = CASE
           WHEN EXCLUDED.mejor_nota > COALESCE(albacer_item_progreso.mejor_nota, -999)
           THEN EXCLUDED.test_id_mejor_intento
           ELSE albacer_item_progreso.test_id_mejor_intento
         END,
         iniciado_en = LEAST(albacer_item_progreso.iniciado_en, EXCLUDED.iniciado_en),
         superado_en = COALESCE(albacer_item_progreso.superado_en, EXCLUDED.superado_en),
         actualizado_en = EXCLUDED.actualizado_en
       RETURNING *`,
      [userId, testId],
    );
    return result.rows?.[0] ?? null;
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
    return result.rows?.[0] ?? null;
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
