import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { progressGeneralStatsRepository } from '../../src/repositories/progressGeneralStats.repository.js';

test('progressGeneralStatsRepository.getDashboard filtra por oposicion y modo', async () => {
  const originalQuery = pool.query;
  let receivedSql = '';
  let receivedParams = [];

  pool.query = async (sql, params) => {
    receivedSql = String(sql);
    receivedParams = params;
    return {
      rows: [{
        total_tests: 2,
        nota_media: '7.5',
        mejor_simulacro: '8.1',
        pendientes_repaso: 1,
        total_marcadas: 3,
      }],
    };
  };

  try {
    const result = await progressGeneralStatsRepository.getDashboard(
      7,
      21,
      { modoPreparacion: 'albacer', albacerModuloId: 5 },
    );

    assert.deepEqual(receivedParams, [7, 21, 'albacer', 5]);
    assert.match(receivedSql, /AND modo_preparacion = \$3/);
    assert.match(receivedSql, /AND \(\$4::bigint IS NULL OR albacer_modulo_id = \$4\)/);
    assert.match(receivedSql, /AND t\.modo_preparacion = \$3/);
    assert.match(receivedSql, /AND \(\$2::bigint IS NULL OR te\.oposicion_id = \$2\)/);
    assert.equal(result.totalTests, 2);
    assert.equal(result.notaMedia, 7.5);
  } finally {
    pool.query = originalQuery;
  }
});
