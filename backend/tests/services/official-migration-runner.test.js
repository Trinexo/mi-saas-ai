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
  legacyCrlfChecksum,
  parseMode,
  validatePlan,
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
  assert.throws(
    () => buildPlan(rows.slice(1), migrations, sqlByFilename),
    /exactamente 36/,
  );
  assert.equal(target.length, 36);
});

test('el plan legacy clasifica las 36 filas como update y 037 explícitamente', async () => {
  const { migrations, target, rows, sqlByFilename } = await baselineFixture();
  const plan = buildPlan(rows.map((row, index) => ({
    ...row,
    checksum: legacyCrlfChecksum(sqlByFilename.get(target[index])),
  })), migrations, sqlByFilename);
  assert.deepEqual(validatePlan(plan), {
    targetCount: 36,
    updateCount: 36,
    unchangedCount: 0,
    invalidCount: 0,
  });
  assert.equal(plan.entries.every((entry) => entry.action === 'update'), true);
  assert.equal(plan.updates.every((entry) => entry.action === 'update'), true);
  assert.equal(plan.entries.find((entry) => entry.filename === '037_albacer_mode_base.sql').action, 'update');
});

test('dry-run no actualiza y la ejecución confirmada es idempotente', async () => {
  const { migrations, target, rows, sqlByFilename } = await baselineFixture();
  const canonical = buildPlan(rows.map((row, index) => ({
    ...row,
    checksum: checksum(sqlByFilename.get(target[index])),
  })), migrations, sqlByFilename);
  assert.equal(canonical.updates.length, 0);
  assert.deepEqual(validatePlan(canonical), {
    targetCount: 36,
    updateCount: 0,
    unchangedCount: 36,
    invalidCount: 0,
  });
  const report = dryRunReport(canonical);
  assert.equal(report.targetCount, 36);
  assert.equal(report.updateCount, 0);
  assert.equal(report.unchangedCount, 36);
  assert.equal(report.invalidCount, 0);
  assert.equal(report.firstMigration, target[0]);
  assert.equal(report.lastMigration, target.at(-1));
  assert.equal(report.updates.every((row) => row.action === 'unchanged'), true);

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

test('el plan bloquea una fila sin acción explícita antes de cualquier UPDATE', async () => {
  const { migrations, target, rows, sqlByFilename } = await baselineFixture();
  const canonical = buildPlan(rows.map((row, index) => ({
    ...row,
    checksum: checksum(sqlByFilename.get(target[index])),
  })), migrations, sqlByFilename);
  const invalid = {
    ...canonical,
    entries: canonical.entries.map((entry, index) => index === 35
      ? { ...entry, action: undefined }
      : entry),
  };
  assert.throws(() => validatePlan(invalid), /Plan de reconciliación inválido/);
  const calls = [];
  await assert.rejects(
    () => applyPlan({ query: async (sql) => { calls.push(sql); } }, invalid),
    /Plan de reconciliación inválido/,
  );
  assert.equal(calls.length, 0);
});

test('el plan bloquea acciones desconocidas y límites de migración incorrectos', async () => {
  const { migrations, target, rows, sqlByFilename } = await baselineFixture();
  const canonical = buildPlan(rows.map((row, index) => ({
    ...row,
    checksum: checksum(sqlByFilename.get(target[index])),
  })), migrations, sqlByFilename);
  assert.throws(() => validatePlan({
    ...canonical,
    entries: canonical.entries.map((entry, index) => index === 0
      ? { ...entry, action: 'skip' }
      : entry),
  }), /Plan de reconcili/);
  assert.throws(() => validatePlan({ ...canonical, target: ['002_add_estado_to_preguntas.sql', ...target.slice(1)] }), /Plan de reconcili/);
  assert.throws(() => validatePlan({ ...canonical, target: [...target.slice(0, -1), '039_add_stripe_webhook_events.sql'] }), /Plan de reconcili/);
});

test('dry-run solo informa y la confirmación actualiza exclusivamente filas update', async () => {
  const { migrations, target, rows, sqlByFilename } = await baselineFixture();
  const legacy = buildPlan(rows.map((row, index) => ({
    ...row,
    checksum: legacyCrlfChecksum(sqlByFilename.get(target[index])),
  })), migrations, sqlByFilename);
  const dryRunClientCalls = [];
  const report = dryRunReport(legacy);
  assert.equal(report.updateCount, 36);
  assert.equal(report.unchangedCount, 0);
  assert.equal(dryRunClientCalls.length, 0);

  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql.trim());
      if (sql.includes('SELECT filename, checksum, status, source')) {
        return { rows: legacy.entries.map((entry) => ({
          filename: entry.filename,
          checksum: entry.canonicalChecksum,
          status: 'applied',
          source: 'baseline',
        })) };
      }
      return { rowCount: 1, rows: [] };
    },
  };
  await applyPlan(client, legacy);
  assert.equal(calls.filter((sql) => sql.startsWith('UPDATE schema_migrations')).length, 36);
  assert.equal(calls.filter((sql) => sql === 'COMMIT').length, 1);
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
