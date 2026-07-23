import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checksum,
  discoverMigrations,
  MIGRATIONS_DIR,
  LOCK_KEY,
  withoutTopLevelTransactionStatements,
} from '../../scripts/migrate-official.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('el runner descubre exclusivamente migraciones SQL numeradas del directorio oficial', async () => {
  const migrations = await discoverMigrations();
  assert.equal(MIGRATIONS_DIR, path.join(root, 'database', 'migrations'));
  assert.ok(migrations.length > 0);
  assert.deepEqual(migrations, [...migrations].sort());
  assert.ok(migrations.every((name) => /^\d+_.+\.sql$/.test(name)));
});

test('el runner usa checksum estable y bloqueo advisory dedicado', () => {
  assert.equal(checksum('abc'), checksum('abc'));
  assert.notEqual(checksum('abc'), checksum('abcd'));
  assert.equal(typeof LOCK_KEY, 'number');
});

test('el runner elimina solo controles de transacción de nivel superior', () => {
  const sql = [
    'BEGIN;',
    'CREATE TABLE prueba_runner (id INTEGER);',
    'DO $$ BEGIN PERFORM 1; END $$;',
    'COMMIT;',
  ].join('\n');
  const normalized = withoutTopLevelTransactionStatements(sql);
  assert.doesNotMatch(normalized, /^BEGIN;?$/m);
  assert.doesNotMatch(normalized, /^COMMIT;?$/m);
  assert.match(normalized, /CREATE TABLE prueba_runner/);
  assert.match(normalized, /DO \$\$ BEGIN PERFORM 1; END \$\$/);
  const source = fs.readFileSync(path.join(root, 'backend', 'scripts', 'migrate-official.mjs'), 'utf8');
  assert.match(source, /pg_advisory_lock/);
  assert.match(source, /schema_migrations/);
});
