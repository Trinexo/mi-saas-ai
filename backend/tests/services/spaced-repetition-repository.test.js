import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spacedRepetitionRepository } from '../../src/repositories/spacedRepetition.repository.js';

describe('spacedRepetitionRepository — exportaciones', () => {
  it('upsertRepaso está exportado', () => {
    assert.equal(typeof spacedRepetitionRepository.upsertRepaso, 'function');
  });
});

describe('spacedRepetitionRepository — lógica de intervalos', () => {
  const { _intervaloDias, _NIVEL_MAX } = spacedRepetitionRepository;

  it('acierto desde nivel 0 → intervalo 1 día', () => {
    assert.equal(_intervaloDias(1), 1);
  });

  it('acierto desde nivel 2 → intervalo 3 días', () => {
    assert.equal(_intervaloDias(2), 3);
  });

  it('acierto desde nivel 3 → intervalo 7 días', () => {
    assert.equal(_intervaloDias(3), 7);
  });

  it('acierto desde nivel 4 → intervalo 14 días', () => {
    assert.equal(_intervaloDias(4), 14);
  });

  it('nivel máximo (5) → intervalo 30 días', () => {
    assert.equal(_intervaloDias(_NIVEL_MAX), 30);
  });

  it('nivel por encima del máximo no supera el intervalo de 30 días', () => {
    assert.equal(_intervaloDias(_NIVEL_MAX + 10), 30);
  });

  it('fallo → nivel 0, intervalo 1 día', () => {
    // nivel 0 → 1 día
    assert.equal(_intervaloDias(0), 1);
  });

  it('nivel máximo es 5', () => {
    assert.equal(_NIVEL_MAX, 5);
  });
});
