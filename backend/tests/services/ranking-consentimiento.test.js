import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { rankingRepository } from '../../src/repositories/ranking.repository.js';
import { rankingService } from '../../src/services/ranking.service.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';

const originalQuery = pool.query;
const originalGetPreparacion = accesoOposicionRepository.getPreparacion;
const originalGetUserScore = rankingRepository.getUserScore;
const originalGetTopByOposicion = rankingRepository.getTopByOposicion;
const originalCountParticipantes = rankingRepository.countParticipantes;

afterEach(() => {
  pool.query = originalQuery;
  accesoOposicionRepository.getPreparacion = originalGetPreparacion;
  rankingRepository.getUserScore = originalGetUserScore;
  rankingRepository.getTopByOposicion = originalGetTopByOposicion;
  rankingRepository.countParticipantes = originalCountParticipantes;
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

describe('rankingService modo preparacion', () => {
  it('bloquea el ranking si la oposicion activa esta en Modo Albacer', async () => {
    accesoOposicionRepository.getPreparacion = async () => ({ modo_preparacion: 'albacer' });
    rankingRepository.getUserScore = async () => {
      throw new Error('No debe calcular ranking Albacer');
    };
    rankingRepository.getTopByOposicion = async () => [];
    rankingRepository.countParticipantes = async () => 0;

    await assert.rejects(
      () => rankingService.getRanking(7, 21),
      (error) => error.status === 403
        && error.message === 'El ranking solo esta disponible en Modo Experto',
    );
  });
});
