import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import {
  checksum,
  discoverMigrations,
  MIGRATIONS_DIR,
} from '../../scripts/migrate-official.mjs';

const { Client } = pg;
const databaseUrl = process.env.BASELINE_042_TEST_DATABASE_URL;
const adminUrl = process.env.BASELINE_042_TEST_ADMIN_URL;
const enabled = process.env.BASELINE_042_TEST_ISOLATED === 'true'
  && process.env.BASELINE_042_TEST_CONFIRM === 'ISOLATED'
  && databaseUrl
  && adminUrl;

function localDatabaseUrl(value, label, { allowPostgres = false } = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} no es una URL válida`);
  }
  assert.ok(['postgres:', 'postgresql:'].includes(parsed.protocol), `${label} debe ser PostgreSQL`);
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(parsed.hostname.toLowerCase()), `${label} debe ser local`);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!allowPostgres) {
    assert.match(database, /(?:test|ci|e2e|dev|local)/i, `${label} debe apuntar a una base aislada`);
    assert.notEqual(database, 'postgres');
  }
  assert.notEqual(database, 'template0');
  assert.notEqual(database, 'template1');
  return { parsed, database };
}

function quoteIdentifier(identifier) {
  assert.match(identifier, /^[A-Za-z_][A-Za-z0-9_]*$/);
  return `"${identifier}"`;
}

function connectionConfig(url) {
  return { connectionString: url, ssl: false };
}

function assertDifferentDatabases(target, admin) {
  assert.notEqual(target.database, admin.database, 'admin y target deben ser bases distintas');
}

async function withClient(url, callback) {
  const client = new Client(connectionConfig(url));
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

function runScript(script, env) {
  const result = spawnSync(process.execPath, [script], {
    cwd: new URL('../../', import.meta.url),
    env,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`${script} falló: ${result.stderr || result.stdout}`.trim());
  }
}

test('URL admin local puede usar postgres, pero la URL objetivo exige marcador de aislamiento', () => {
  assert.equal(
    localDatabaseUrl('postgresql://postgres@127.0.0.1:5433/postgres', 'admin', { allowPostgres: true }).database,
    'postgres',
  );
  assert.throws(
    () => localDatabaseUrl('postgresql://postgres@127.0.0.1:5433/postgres', 'target'),
    /base aislada/,
  );
});

test('URL admin rechaza template0 y template1', () => {
  for (const database of ['template0', 'template1']) {
    assert.throws(
      () => localDatabaseUrl(`postgresql://postgres@127.0.0.1:5433/${database}`, 'admin', { allowPostgres: true }),
      /template/,
    );
  }
});

test('las guardas rechazan host remoto y objetivo sin marcador', () => {
  assert.throws(
    () => localDatabaseUrl('postgresql://postgres@example.invalid:5433/postgres', 'admin', { allowPostgres: true }),
    /debe ser local/,
  );
  assert.throws(
    () => localDatabaseUrl('postgresql://postgres@127.0.0.1:5433/production', 'target'),
    /base aislada/,
  );
});

test('admin y target deben ser bases distintas', () => {
  const target = localDatabaseUrl('postgresql://postgres@127.0.0.1:5433/plataforma_test', 'target');
  const admin = localDatabaseUrl('postgresql://postgres@127.0.0.1:5433/plataforma_test', 'admin', { allowPostgres: true });
  assert.throws(
    () => assertDifferentDatabases(target, admin),
    /bases distintas/,
  );
});

test('bootstrap snapshot 042 reconstruye una base limpia e idempotente', {
  skip: !enabled ? 'requiere BASELINE_042_TEST_* explícitas y una base local aislada' : false,
}, async () => {
  const target = localDatabaseUrl(databaseUrl, 'BASELINE_042_TEST_DATABASE_URL');
  const admin = localDatabaseUrl(adminUrl, 'BASELINE_042_TEST_ADMIN_URL', { allowPostgres: true });
  assertDifferentDatabases(target, admin);

  const adminClient = new Client(connectionConfig(adminUrl));
  await adminClient.connect();
  try {
    await adminClient.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()', [target.database]);
    await adminClient.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(target.database)}`);
    await adminClient.query(`CREATE DATABASE ${quoteIdentifier(target.database)}`);
  } finally {
    await adminClient.end();
  }

  const childEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    ALLOW_LOCAL_DB_BOOTSTRAP: 'true',
    BOOTSTRAP_CONFIRM: 'BASELINE_042',
    BOOTSTRAP_LOAD_SEED: 'true',
  };

  try {
    runScript('scripts/bootstrap-schema-if-empty.mjs', childEnv);
    runScript('scripts/migrate-official.mjs', childEnv);

    await withClient(databaseUrl, async (client) => {
      const migrations = await discoverMigrations(MIGRATIONS_DIR);
      const expected = new Map();
      for (const filename of migrations) {
        expected.set(filename, checksum(await readFile(new URL(`../../../database/migrations/${filename}`, import.meta.url), 'utf8')));
      }
      const registry = await client.query('SELECT filename, checksum, status, source FROM schema_migrations ORDER BY filename');
      assert.deepEqual(registry.rows.map((row) => row.filename), migrations);
      assert.ok(registry.rows.every((row) => row.status === 'applied' && row.source === 'schema'));
      for (const row of registry.rows) assert.equal(row.checksum, expected.get(row.filename));

      const objects = await client.query(`
        SELECT name, to_regclass('public.' || name) IS NOT NULL AS present
        FROM unnest($1::text[]) AS item(name)
      `, [[
        'usuarios', 'oposiciones', 'temas', 'bloques', 'preguntas', 'tests',
        'accesos_oposicion', 'acceso_oposicion_modelos', 'accesos_oposicion_historial',
        'stripe_webhook_events', 'configuracion_sistema', 'planificaciones_academicas',
        'albacer_modulos',
      ]]);
      assert.ok(objects.rows.every((row) => row.present), JSON.stringify(objects.rows));

      const columns = await client.query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND ((table_name = 'usuarios' AND column_name = 'deleted_at')
            OR (table_name = 'oposiciones' AND column_name IN ('slug', 'precio_mensual_cents', 'tiempo_limite_minutos'))
            OR (table_name = 'accesos_oposicion' AND column_name = 'stripe_session_id')
            OR (table_name IN ('preguntas', 'admin_tests') AND column_name = 'nivel_dificultad'))
      `);
      assert.ok(columns.rows.some((row) => row.table_name === 'usuarios' && row.column_name === 'deleted_at'));
      assert.ok(columns.rows.some((row) => row.table_name === 'oposiciones' && row.column_name === 'slug'));
      assert.ok(columns.rows.some((row) => row.table_name === 'accesos_oposicion' && row.column_name === 'stripe_session_id'));
      assert.ok(columns.rows.filter((row) => row.column_name === 'nivel_dificultad').every((row) => row.data_type === 'character varying'));

      const seed = await client.query(`
        SELECT
          EXISTS (SELECT 1 FROM oposiciones WHERE slug = 'auxiliar-administrativo') AS oposicion,
          EXISTS (SELECT 1 FROM temas WHERE nombre = 'Constitución') AS tema,
          EXISTS (SELECT 1 FROM preguntas WHERE enunciado = '¿Cuántos artículos tiene la Constitución Española de 1978?') AS pregunta
      `);
      assert.deepEqual(seed.rows[0], { oposicion: true, tema: true, pregunta: true });
    });

    runScript('scripts/bootstrap-schema-if-empty.mjs', childEnv);
    runScript('scripts/migrate-official.mjs', childEnv);
  } finally {
    const cleanupClient = new Client(connectionConfig(adminUrl));
    await cleanupClient.connect();
    try {
      await cleanupClient.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()', [target.database]);
      await cleanupClient.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(target.database)}`);
    } finally {
      await cleanupClient.end();
    }
  }
});
