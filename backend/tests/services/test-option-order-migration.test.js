import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sql = fs.readFileSync(path.join(root, 'database/migrations/045_tests_preguntas_opciones_orden.sql'), 'utf8');

test('045 añade el snapshot de opciones de forma idempotente', () => {
  assert.match(sql, /ALTER TABLE tests_preguntas/i);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS opciones_orden BIGINT\[\]/i);
});
