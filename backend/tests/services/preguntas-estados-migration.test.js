import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(here, '../../../database/migrations/043_preguntas_estados_editoriales.sql');

test('043 define la conversión y el catálogo editorial definitivo', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /SET estado\s*=\s*'revision'\s+WHERE estado\s*=\s*'pendiente'/i);
  assert.match(sql, /SET estado\s*=\s*'cancelada'\s+WHERE estado\s*=\s*'rechazada'/i);
  assert.match(sql, /CHECK\s*\(estado IN \('aprobada', 'revision', 'cancelada'\)\)/i);
  assert.match(sql, /ALTER COLUMN estado SET DEFAULT 'aprobada'/i);
  assert.doesNotMatch(sql, /'pendiente'\s*,\s*'aprobada'\s*,\s*'rechazada'/i);
});
