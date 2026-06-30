import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { widgetEngagementFocoSesionRepository } from '../../src/repositories/widgetEngagementFocoSesion.repository.js';

test('getFocoHoy devuelve respuesta neutra en Modo Albacer', async () => {
  const originalQuery = pool.query;
  pool.query = async () => {
    throw new Error('No debe consultar foco libre en Modo Albacer');
  };

  try {
    const result = await widgetEngagementFocoSesionRepository.getFocoHoy(
      7,
      21,
      { modoPreparacion: 'albacer' },
    );

    assert.equal(result.modo, 'albacer');
    assert.equal(result.oposicionId, 21);
    assert.equal(result.numeroPreguntas, 0);
  } finally {
    pool.query = originalQuery;
  }
});

test('getFocoHoy filtra consultas por oposicion activa en Modo Experto', async () => {
  const originalQuery = pool.query;
  const calls = [];

  pool.query = async (sql, params) => {
    calls.push({ sql: String(sql), params });
    if (String(sql).includes('FROM repeticion_espaciada')) return { rows: [] };
    if (String(sql).includes('FROM tests t')) return { rows: [] };
    if (String(sql).includes('FROM progreso_usuario')) return { rows: [] };
    return { rows: [] };
  };

  try {
    const result = await widgetEngagementFocoSesionRepository.getFocoHoy(
      7,
      21,
      { modoPreparacion: 'experto' },
    );

    assert.equal(result.modo, 'adaptativo');
    assert.equal(result.oposicionId, 21);
    assert.equal(calls.length, 3);
    assert.deepEqual(calls[0].params, [7, 21]);
    assert.deepEqual(calls[1].params, [7, 'experto', 21]);
    assert.deepEqual(calls[2].params, [7, 21]);
    assert.match(calls[0].sql, /te\.oposicion_id = \$2/);
    assert.match(calls[1].sql, /t\.modo_preparacion = \$2/);
    assert.match(calls[1].sql, /te\.oposicion_id = \$3/);
  } finally {
    pool.query = originalQuery;
  }
});
