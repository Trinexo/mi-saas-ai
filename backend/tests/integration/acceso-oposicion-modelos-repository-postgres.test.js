import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pool from '../../src/config/db.js';
import { accesoOposicionModelosRepository as repository } from '../../src/repositories/accesoOposicionModelos.repository.js';

function validarBaseAislada({ databaseUrl, configuredDatabaseUrl, confirmation, isolated } = {}) {
  if (!databaseUrl || !configuredDatabaseUrl || databaseUrl !== configuredDatabaseUrl) {
    return { ok: false, reason: 'URL ausente o distinta' };
  }
  if (confirmation !== 'ISOLATED' || isolated !== 'true') {
    return { ok: false, reason: 'confirmación incorrecta' };
  }
  let parsed;
  try { parsed = new URL(databaseUrl); } catch { return { ok: false, reason: 'URL inválida' }; }
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol.toLowerCase())) {
    return { ok: false, reason: 'protocolo no permitido' };
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    return { ok: false, reason: 'host no local' };
  }
  let databaseName;
  try { databaseName = decodeURIComponent(parsed.pathname).replace(/^\/+/, ''); } catch {
    return { ok: false, reason: 'nombre de base no aislado' };
  }
  if (!databaseName || !/(test|ci|e2e)/i.test(databaseName)) {
    return { ok: false, reason: 'nombre de base no aislado' };
  }
  return { ok: true, reason: null };
}

const guard = validarBaseAislada({
  databaseUrl: process.env.DATABASE_URL,
  configuredDatabaseUrl: process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL,
  confirmation: process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM,
  isolated: process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED,
});
const isCi = /^(true|1|yes)$/i.test(process.env.CI ?? '');
const configValues = [
  process.env.DATABASE_URL,
  process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL,
  process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM,
  process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED,
];
const hasAnyConfiguration = configValues.some((value) => typeof value === 'string' && value.length > 0);
if ((isCi || hasAnyConfiguration) && !guard.ok) {
  throw new Error(`Suite PostgreSQL de modelos no aislada: ${guard.reason}`);
}
if (!isCi && !hasAnyConfiguration) console.warn('[skip] Suite PostgreSQL de modelos: no hay configuración aislada');
const options = { skip: !guard.ok, concurrency: false };
const marker = `models_repo_${crypto.randomUUID()}`;

async function createFixture(client, suffix) {
  const user = await client.query(
    `INSERT INTO usuarios (nombre, email, password_hash, role)
     VALUES ($1, $2, 'test-hash', 'alumno') RETURNING id`,
    [`${marker}_${suffix}`, `${marker}_${suffix}@test.local`],
  );
  const oposicion = await client.query(
    `INSERT INTO oposiciones (nombre, slug, estado)
     VALUES ($1, $2, 'activa') RETURNING id`,
    [`${marker}_${suffix}`, `${marker}_${suffix}`],
  );
  const acceso = await client.query(
    `INSERT INTO accesos_oposicion
      (usuario_id, oposicion_id, estado, modo_preparacion, modo_activo)
     VALUES ($1, $2, 'activo', 'experto', 'experto') RETURNING id`,
    [user.rows[0].id, oposicion.rows[0].id],
  );
  return { userId: user.rows[0].id, oposicionId: oposicion.rows[0].id, accesoId: acceso.rows[0].id };
}

async function withTransaction(suffix, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const fixture = await createFixture(client, suffix);
    return await callback(client, fixture);
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

async function modelos(client, accesoId) {
  return (await repository.listarPorAcceso(accesoId, client)).map((row) => row.modelo);
}

test('modelos inserta experto y guiado y consulta tieneModelo', options, async () => withTransaction('insert', async (client, fixture) => {
  await repository.insertarModelo(fixture.accesoId, 'experto', client);
  await repository.insertarModelo(fixture.accesoId, 'guiado', client);
  assert.deepEqual(await modelos(client, fixture.accesoId), ['experto', 'guiado']);
  assert.equal(await repository.tieneModelo(fixture.accesoId, 'experto', client), true);
  await assert.rejects(() => repository.tieneModelo(fixture.accesoId, 'albacer', client), /modelo debe ser exactamente/);
}));

test('modelos acepta IDs BIGINT seguros y conserva strings fuera del rango seguro', options, async () => {
  const largeId = '9007199254740993';
  const maxBigInt = '9223372036854775807';
  const aboveMaxBigInt = '9223372036854775808';
  const calls = [];
  const client = {
    query: async (sql, parameters) => {
      calls.push({ sql, parameters });
      if (/SELECT 1/i.test(sql)) return { rowCount: 1, rows: [{}] };
      return {
        rows: [{
          id: largeId,
          acceso_id: '42',
          modelo: 'experto',
          creado_en: '2026-08-01T00:00:00.000Z',
        }],
      };
    },
  };

  assert.equal(await repository.tieneModelo(42, 'experto', client), true);
  assert.equal(await repository.tieneModelo('42', 'experto', client), true);
  assert.equal(await repository.tieneModelo(largeId, 'experto', client), true);
  assert.equal(await repository.tieneModelo(maxBigInt, 'experto', client), true);
  assert.deepEqual(calls.slice(0, 4).map(({ parameters }) => parameters[0]), [42, '42', largeId, maxBigInt]);
  await assert.rejects(
    () => repository.tieneModelo(aboveMaxBigInt, 'experto', client),
    /accesoId debe ser un entero positivo/,
  );

  const [row] = await repository.listarPorAcceso('42', client);
  assert.equal(row.id, largeId);
  assert.equal(row.accesoId, 42);

  for (const invalid of [null, undefined, '', '0', '-1', '1.5', '1e3', Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(
      () => repository.tieneModelo(invalid, 'experto', client),
      /accesoId debe ser un entero positivo/,
    );
  }
});

test('modelos rechaza todos los valores no canónicos', options, async () => withTransaction('invalid', async (client, fixture) => {
  for (const value of [undefined, null, '', 'albacer', 'desconocido', 'EXPERTO', ' experto', 'experto ']) {
    await assert.rejects(
      () => repository.insertarModelo(fixture.accesoId, value, client),
      /modelo debe ser exactamente/,
    );
  }
}));

test('modelos rechaza duplicados y conserva el error de constraint', options, async () => withTransaction('duplicate', async (client, fixture) => {
  await repository.insertarModelo(fixture.accesoId, 'experto', client);
  await assert.rejects(
    () => repository.insertarModelo(fixture.accesoId, 'experto', client),
    (error) => error.code === '23505',
  );
}));

test('modelos devuelve siempre el orden experto y guiado', options, async () => withTransaction('order', async (client, fixture) => {
  await repository.insertarModelo(fixture.accesoId, 'guiado', client);
  await repository.insertarModelo(fixture.accesoId, 'experto', client);
  assert.deepEqual(await modelos(client, fixture.accesoId), ['experto', 'guiado']);
}));

test('reemplazarModelos es idempotente y no cambia creado_en', options, async () => withTransaction('replace', async (client, fixture) => {
  await repository.insertarModelo(fixture.accesoId, 'experto', client);
  const changed = await repository.reemplazarModelos(fixture.accesoId, ['guiado', 'experto'], client);
  assert.deepEqual(changed, { cambiado: true, modelos: ['experto', 'guiado'] });
  const before = await client.query(
    'SELECT id, creado_en FROM acceso_oposicion_modelos WHERE acceso_id = $1 ORDER BY modelo',
    [fixture.accesoId],
  );
  const unchanged = await repository.reemplazarModelos(fixture.accesoId, ['experto', 'guiado'], client);
  assert.deepEqual(unchanged, { cambiado: false, modelos: ['experto', 'guiado'] });
  const after = await client.query(
    'SELECT id, creado_en FROM acceso_oposicion_modelos WHERE acceso_id = $1 ORDER BY modelo',
    [fixture.accesoId],
  );
  assert.deepEqual(after.rows.map((row) => row.id), before.rows.map((row) => row.id));
  assert.deepEqual(after.rows.map((row) => row.creado_en), before.rows.map((row) => row.creado_en));
}));

test('reemplazarModelos exige cliente externo y rechaza vacío o duplicados', options, async () => withTransaction('contract', async (client, fixture) => {
  await assert.rejects(() => repository.reemplazarModelos(fixture.accesoId, ['experto']), /cliente PostgreSQL válido/);
  await assert.rejects(() => repository.reemplazarModelos(fixture.accesoId, [], client), /array no vacío/);
  await assert.rejects(() => repository.reemplazarModelos(fixture.accesoId, ['experto', 'experto'], client), /duplicados/);
}));

test('reemplazarModelos revierte un fallo intermedio real', options, async () => withTransaction('rollback', async (client, fixture) => {
  await repository.insertarModelo(fixture.accesoId, 'experto', client);
  await client.query('SAVEPOINT replace_failure');
  const originalQuery = client.query.bind(client);
  let insertions = 0;
  let deleteReached = false;
  let firstInsertReached = false;
  let secondInsertReached = false;
  const failingClient = {
    query: async (...args) => {
      const sql = typeof args[0] === 'string' ? args[0] : args[0].text;
      if (/DELETE FROM acceso_oposicion_modelos/i.test(sql)) deleteReached = true;
      if (/INSERT INTO acceso_oposicion_modelos/i.test(sql)) {
        insertions += 1;
        if (insertions === 1) firstInsertReached = true;
        if (insertions === 2) {
          secondInsertReached = true;
          const parameters = typeof args[0] === 'string' ? args[1] : args[0].values;
          const duplicateParameters = [parameters[0], 'experto'];
          return originalQuery(args[0], duplicateParameters);
        }
      }
      return originalQuery(...args);
    },
  };
  await assert.rejects(
    () => repository.reemplazarModelos(fixture.accesoId, ['experto', 'guiado'], failingClient),
    (error) => error.code === '23505',
  );
  assert.equal(deleteReached, true);
  assert.equal(firstInsertReached, true);
  assert.equal(secondInsertReached, true);
  await client.query('ROLLBACK TO SAVEPOINT replace_failure');
  assert.deepEqual(await modelos(client, fixture.accesoId), ['experto']);
}));

test('reemplazarModelos y eliminarModelo no modifican modo_activo ni otros campos', options, async () => withTransaction('fields', async (client, fixture) => {
  const before = await client.query(
    'SELECT modo_activo, precio_pagado, notas, fecha_inicio, fecha_fin FROM accesos_oposicion WHERE id = $1',
    [fixture.accesoId],
  );
  await repository.insertarModelo(fixture.accesoId, 'experto', client);
  await repository.reemplazarModelos(fixture.accesoId, ['guiado'], client);
  const after = await client.query(
    'SELECT modo_activo, precio_pagado, notas, fecha_inicio, fecha_fin FROM accesos_oposicion WHERE id = $1',
    [fixture.accesoId],
  );
  assert.deepEqual(after.rows[0], before.rows[0]);
}));

test('eliminarModelo permite quitar uno de dos y rechaza quitar el último', options, async () => withTransaction('delete', async (client, fixture) => {
  await repository.insertarModelo(fixture.accesoId, 'experto', client);
  await repository.insertarModelo(fixture.accesoId, 'guiado', client);
  const deleted = await repository.eliminarModelo(fixture.accesoId, 'experto', client);
  assert.equal(deleted.cambiado, true);
  assert.deepEqual(await modelos(client, fixture.accesoId), ['guiado']);
  await assert.rejects(() => repository.eliminarModelo(fixture.accesoId, 'guiado', client), /sin modelos/);
  assert.deepEqual(await modelos(client, fixture.accesoId), ['guiado']);
  assert.deepEqual(await repository.eliminarModelo(fixture.accesoId, 'experto', client), { cambiado: false, modelo: null });
}));

test('eliminarModelo serializa dos eliminaciones concurrentes', options, async () => {
  const fixtureClient = await pool.connect();
  let fixture;
  try {
    await fixtureClient.query('BEGIN');
    fixture = await createFixture(fixtureClient, 'concurrency');
    await repository.insertarModelo(fixture.accesoId, 'experto', fixtureClient);
    await repository.insertarModelo(fixture.accesoId, 'guiado', fixtureClient);
    await fixtureClient.query('COMMIT');
  } finally {
    fixtureClient.release();
  }

  const firstClient = await pool.connect();
  const secondClient = await pool.connect();
  try {
    await firstClient.query('BEGIN');
    await secondClient.query('BEGIN');
    await secondClient.query("SET LOCAL statement_timeout = '3000ms'");

    const firstResult = await repository.eliminarModelo(fixture.accesoId, 'experto', firstClient);
    assert.equal(firstResult.cambiado, true);

    const secondAttempt = repository.eliminarModelo(fixture.accesoId, 'guiado', secondClient);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await firstClient.query('COMMIT');
    await assert.rejects(secondAttempt, /sin modelos/);
    await secondClient.query('ROLLBACK');

    const remaining = await pool.query(
      'SELECT modelo FROM acceso_oposicion_modelos WHERE acceso_id = $1 ORDER BY modelo',
      [fixture.accesoId],
    );
    assert.deepEqual(remaining.rows.map((row) => row.modelo), ['guiado']);
  } finally {
    await firstClient.query('ROLLBACK').catch(() => {});
    await secondClient.query('ROLLBACK').catch(() => {});
    firstClient.release();
    secondClient.release();
    await pool.query('DELETE FROM accesos_oposicion WHERE id = $1', [fixture.accesoId]);
    await pool.query('DELETE FROM usuarios WHERE id = $1', [fixture.userId]);
    await pool.query('DELETE FROM oposiciones WHERE id = $1', [fixture.oposicionId]);
  }
});

before(async () => { if (guard.ok) await pool.query('SELECT 1'); });
after(async () => { await pool.end(); });
