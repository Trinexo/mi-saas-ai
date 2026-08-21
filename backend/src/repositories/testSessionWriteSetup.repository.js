import pool from '../config/db.js';
import { fisherYates } from '../utils/test-option-order.js';

export const testSessionWriteSetupRepository = {
  async createTest({
    userId,
    planificacionId,
    temaId,
    bloqueId,
    oposicionId,
    tipoTest,
    numeroPreguntas,
    duracionSegundos,
    modoPreparacion = 'experto',
    albacerModuloId = null,
    albacerItemId = null,
    scoringSnapshot = null,
  }) {
    // Derivar oposicion_id desde tema si no se pasa explícitamente
    let resolvedOposicionId = oposicionId || null;
    if (!resolvedOposicionId && temaId) {
      const r = await pool.query('SELECT oposicion_id FROM temas WHERE id = $1', [temaId]);
      resolvedOposicionId = r.rows[0]?.oposicion_id ?? null;
    }

    const result = await pool.query(
      `INSERT INTO tests (
         usuario_id, planificacion_id, tema_id, bloque_id, oposicion_id,
         modo_preparacion, albacer_modulo_id, albacer_item_id, scoring_snapshot,
         tipo_test, numero_preguntas, duracion_segundos, estado
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, 'generado')
       RETURNING id`,
      [
        userId,
        planificacionId || null,
        temaId || null,
        bloqueId || null,
        resolvedOposicionId,
        modoPreparacion,
        albacerModuloId || null,
        albacerItemId || null,
        scoringSnapshot ? JSON.stringify(scoringSnapshot) : null,
        tipoTest,
        numeroPreguntas,
        duracionSegundos || null,
      ],
    );
    return result.rows[0];
  },

  async insertTestPreguntas(testId, preguntaIds) {
    const ids = preguntaIds.map((item) => (typeof item === 'object' ? item.id : item));
    if (ids.length === 0) return [];
    const optionsResult = await pool.query(
      `SELECT pregunta_id::text AS pregunta_id, id::text AS opcion_id
         FROM opciones_respuesta
        WHERE pregunta_id = ANY($1::bigint[])
        ORDER BY pregunta_id, id`,
      [ids],
    );
    const optionsByQuestion = new Map();
    for (const row of optionsResult.rows) {
      const current = optionsByQuestion.get(row.pregunta_id) ?? [];
      current.push(row.opcion_id);
      optionsByQuestion.set(row.pregunta_id, current);
    }
    const orders = ids.map((preguntaId) => ({
      preguntaId: String(preguntaId),
      opcionesOrden: fisherYates(optionsByQuestion.get(String(preguntaId)) ?? []),
    }));
    const values = [];
    const placeholders = orders.map((item, index) => {
      const offset = index * 4;
      values.push(testId, item.preguntaId, index + 1, item.opcionesOrden.length ? item.opcionesOrden : null);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}::bigint[])`;
    }).join(',');
    await pool.query(
      `INSERT INTO tests_preguntas (test_id, pregunta_id, orden, opciones_orden)
       VALUES ${placeholders}`,
      values,
    );
    return orders;
  },

  async setPlanificacion(testId, planificacionId) {
    await pool.query(
      'UPDATE tests SET planificacion_id = $2 WHERE id = $1',
      [testId, planificacionId],
    );
  },

  async getContextoNombres(temaId, oposicionId) {
    let temaNombre = null;
    let oposicionNombre = null;
    if (temaId) {
      const r = await pool.query('SELECT nombre FROM temas WHERE id = $1', [temaId]);
      if (r.rows[0]) temaNombre = r.rows[0].nombre;
    }
    if (oposicionId) {
      const r = await pool.query('SELECT nombre FROM oposiciones WHERE id = $1', [oposicionId]);
      if (r.rows[0]) oposicionNombre = r.rows[0].nombre;
    }
    return { temaNombre, oposicionNombre };
  },
};
