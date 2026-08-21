import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('048 crea la configuración global con default seguro e idempotente', () => {
  const file = path.resolve(import.meta.dirname, '../../../database/migrations/048_oposiciones_modelos_disponibles.sql');
  const sql = fs.readFileSync(file, 'utf8');
  assert.match(sql, /ADD COLUMN IF NOT EXISTS modelos_disponibles TEXT\[\]/);
  assert.match(sql, /ARRAY\['experto', 'guiado'\]/);
  assert.match(sql, /chk_oposiciones_modelos_disponibles/);
});
