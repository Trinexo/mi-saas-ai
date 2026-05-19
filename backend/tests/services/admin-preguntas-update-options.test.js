import test from 'node:test';
import assert from 'node:assert/strict';
import { adminPreguntasEntityWriteRepository } from '../../src/repositories/adminPreguntasEntityWrite.repository.js';

test('updateOpciones actualiza opciones existentes sin borrarlas', async () => {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT id FROM opciones_respuesta')) {
        return { rowCount: 4, rows: [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }] };
      }
      return { rowCount: 1, rows: [] };
    },
  };

  await adminPreguntasEntityWriteRepository.updateOpciones(client, 157, [
    { texto: 'A', correcta: false },
    { texto: 'B', correcta: true },
    { texto: 'C', correcta: false },
    { texto: 'D', correcta: false },
  ]);

  assert.equal(calls.length, 5);
  assert.ok(calls.every((call) => !call.sql.includes('DELETE FROM opciones_respuesta')));
  assert.deepEqual(calls[1].params, [10, 'A', false]);
  assert.deepEqual(calls[2].params, [11, 'B', true]);
});

