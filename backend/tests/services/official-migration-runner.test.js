import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checksum,
  discoverMigrations,
  MIGRATIONS_DIR,
  LOCK_KEY,
  withoutTopLevelTransactionStatements,
} from '../../scripts/migrate-official.mjs';
import {
  applyPlan,
  baselineMigrations,
  buildPlan,
  dryRunReport,
  parseMode,
} from '../../scripts/reconcile-baseline-checksums.mjs';

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
  assert.equal(
    checksum('linea 1\nlinea 2\n'),
    checksum('linea 1\r\nlinea 2\r\n'),
  );
  assert.equal(checksum('linea 1\nlinea 2\n'), checksum('linea 1\rlinea 2\r'));
  assert.notEqual(checksum('linea 1\nlinea 2'), checksum('linea 1\nlinea 2\n'));
  assert.equal(typeof LOCK_KEY, 'number');
});

test('el reconciliador exige exactamente un modo explícito', () => {
  assert.deepEqual(parseMode(['--dry-run']), { dryRun: true, confirmed: false });
  assert.deepEqual(parseMode(['--confirm=RECONCILE_BASELINE_CHECKSUMS']), { dryRun: false, confirmed: true });
  assert.throws(() => parseMode([]), /exactamente un modo/);
  assert.throws(() => parseMode(['--dry-run', '--confirm=RECONCILE_BASELINE_CHECKSUMS']), /exactamente un modo/);
  assert.throws(() => parseMode(['--confirm=BASELINE']), /Argumento no reconocido/);
});

async function baselineFixture() {
  const migrations = await discoverMigrations();
  const target = baselineMigrations(migrations);
  const sqlByFilename = new Map();
  for (const filename of target) {
    sqlByFilename.set(filename, await fsPromises.readFile(path.join(MIGRATIONS_DIR, filename), 'utf8'));
  }
  const rows = target.map((filename) => ({
    filename,
    checksum: 'placeholder',
    status: 'applied',
    source: 'baseline',
  }));
  return { migrations, target, rows, sqlByFilename };
}

test('el reconciliador rechaza checksum desconocido, filas runner y la migración 039', async () => {
  const { migrations, target, rows, sqlByFilename } = await baselineFixture();
  const canonicalRows = rows.map((row) => ({ ...row, checksum: 'placeholder' }));

  assert.throws(
    () => buildPlan(canonicalRows.map((row, index) => index === 0
      ? { ...row, checksum: 'desconocido' }
      : row), migrations, sqlByFilename),
    /Checksum incompatible/,
  );
  assert.throws(
    () => buildPlan(canonicalRows.map((row, index) => index === 0
      ? { ...row, filename: '999_desconocida.sql' }
      : row), migrations, sqlByFilename),
    /Filename desconocido/,
  );
  assert.throws(
    () => buildPlan(canonicalRows.map((row, index) => index === 0
      ? { ...row, source: 'runner' }
      : row), migrations, sqlByFilename),
    /source=baseline/,
  );
  assert.throws(
    () => buildPlan([...canonicalRows, {
      filename: '039_add_stripe_webhook_events.sql',
      checksum: 'x',
      status: 'applied',
      source: 'baseline',
    }], migrations, sqlByFilename),
    /039/,
  );
  assert.equal(target.length, 36);
});

test('dry-run no actualiza y la ejecución confirmada es idempotente', async () => {
  const { migrations, target, rows, sqlByFilename } = await baselineFixture();
  const canonical = buildPlan(rows.map((row, index) => ({
    ...row,
    checksum: checksum(sqlByFilename.get(target[index])),
  })), migrations, sqlByFilename);
  assert.equal(canonical.updates.length, 0);
  assert.equal(dryRunReport(canonical).updates.every((row) => row.action === 'already-canonical'), true);

  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql.trim());
      if (sql.includes('SELECT filename, checksum, status, source')) {
        return { rows: [...canonical.entries].map((entry) => ({
          filename: entry.filename,
          checksum: entry.canonicalChecksum,
          status: 'applied',
          source: 'baseline',
        })) };
      }
      return { rowCount: 0, rows: [] };
    },
  };
  await applyPlan(client, canonical);
  await applyPlan(client, canonical);
  assert.equal(calls.filter((sql) => sql.startsWith('UPDATE schema_migrations')).length, 0);
  assert.equal(calls.filter((sql) => sql === 'COMMIT').length, 2);
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
