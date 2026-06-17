import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationSQL = readFileSync(
  join(__dirname, '../../..', 'database/migrations/037_recalculate_resultados_test_notas.sql'),
  'utf8',
);

describe('migration 037 — recalculo de notas por numero de opciones', () => {
  it('actualiza resultados_test desde respuestas y opciones existentes', () => {
    assert.match(migrationSQL, /UPDATE resultados_test rt/);
    assert.match(migrationSQL, /JOIN tests_preguntas tp/);
    assert.match(migrationSQL, /LEFT JOIN respuestas_usuario ru/);
    assert.match(migrationSQL, /FROM opciones_respuesta o/);
  });

  it('usa la formula 1 dividido entre opciones menos 1 para penalizar errores', () => {
    assert.match(migrationSQL, /1::numeric \/ GREATEST\(opciones\.total_opciones - 1, 1\)/);
  });

  it('limita la nota minima a cero y redondea a dos decimales', () => {
    assert.match(migrationSQL, /ROUND\(/);
    assert.match(migrationSQL, /GREATEST\(\s*0::numeric,/);
  });
});
