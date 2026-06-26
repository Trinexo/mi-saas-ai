import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { rankingRepository } from '../../src/repositories/ranking.repository.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('rankingRepository consentimiento publico', () => {
  it('el top solo incluye accesos con ranking_publico activo', async () => {
    let receivedSql = '';
    pool.query = async (sql) => {
      receivedSql = sql;
      return { rows: [] };
    };

    await rankingRepository.getTopByOposicion(10, 7, 10);

    assert.match(receivedSql, /ao\.ranking_publico = TRUE/);
    assert.match(receivedSql, /t\.modo_preparacion = 'experto'/);
  });

  it('el total de participantes solo cuenta ranking_publico activo', async () => {
    let receivedSql = '';
    pool.query = async (sql) => {
      receivedSql = sql;
      return { rows: [{ total: 0 }] };
    };

    await rankingRepository.countParticipantes(10);

    assert.match(receivedSql, /ao\.ranking_publico = TRUE/);
    assert.match(receivedSql, /t\.modo_preparacion = 'experto'/);
  });
});
