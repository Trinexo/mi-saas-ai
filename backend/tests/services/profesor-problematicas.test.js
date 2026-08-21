import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { profesorWorkspaceAnalyticsRepository } from '../../src/repositories/profesorWorkspaceAnalytics.repository.js';
import { profesorWorkspaceAnalyticsService } from '../../src/services/profesorWorkspaceAnalytics.service.js';

test('problemáticas separa respuestas y reportes y excluye respuestas en blanco de fallos', async () => {
  const originalQuery = pool.query;
  let capturedSql = '';
  pool.query = async (sql) => {
    capturedSql = sql;
    return { rows: [{ id: '9007199254740993', reportes: 1, intentos: 5, fallos: 3, blancos: 1, tasa_fallo: 60, tasa_blancos: 20, motivos: ['reportes_abiertos', 'tasa_fallo'] }] };
  };
  try {
    const rows = await profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas('17', {
      oposicionId: '23', temaId: null, limit: 20, offset: 0,
    });
    assert.deepEqual(rows[0].motivos, ['reportes_abiertos', 'tasa_fallo']);
    assert.match(capturedSql, /respuesta_id IS NOT NULL AND ru\.correcta = false/);
    assert.match(capturedSql, /rp\.estado IN \('abierto', 'en_revision'\)/);
    assert.doesNotMatch(capturedSql, /p\.estado\s*=/);
    assert.match(capturedSql, /GROUP BY ru\.pregunta_id/);
    assert.match(capturedSql, /GROUP BY rp\.pregunta_id/);
  } finally {
    pool.query = originalQuery;
  }
});

test('el servicio expone motivos y métricas calculados por backend sin estado editorial', async () => {
  const originalQuery = pool.query;
  pool.query = async (sql) => {
    if (sql.includes('FROM profesores_oposiciones')) return { rows: [{ '?column?': 1 }] };
    return { rows: [{ id: '9007199254740993', reportes: 1, intentos: 5, fallos: 3, blancos: 1, tasa_fallo: 60, tasa_blancos: 20, motivos: ['tasa_fallo'] }] };
  };
  try {
    const result = await profesorWorkspaceAnalyticsService.preguntasProblematicas('17', { oposicion_id: '23' });
    assert.equal(result.items[0].id, '9007199254740993');
    assert.deepEqual(result.items[0].motivos, ['tasa_fallo']);
    assert.equal(result.items[0].tasaFallo, 60);
    assert.equal(result.items[0].tasaBlancos, 20);
    assert.equal(result.items[0].reportesAbiertos, 1);
    assert.equal(result.items[0].estado, undefined);
  } finally {
    pool.query = originalQuery;
  }
});
