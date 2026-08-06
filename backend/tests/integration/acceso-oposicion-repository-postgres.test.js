import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pool from '../../src/config/db.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function validarConfiguracionBaseAislada({
  databaseUrl,
  configuredDatabaseUrl,
  confirmation,
  isolated,
} = {}) {
  if (!databaseUrl || !configuredDatabaseUrl || databaseUrl !== configuredDatabaseUrl) {
    return { ok: false, reason: 'URL ausente o distinta' };
  }
  if (confirmation !== 'ISOLATED' || isolated !== 'true') {
    return { ok: false, reason: 'confirmación incorrecta' };
  }

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return { ok: false, reason: 'URL ausente o distinta' };
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol.toLowerCase())) {
    return { ok: false, reason: 'protocolo no permitido' };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!LOCAL_HOSTS.has(hostname)) {
    return { ok: false, reason: 'host no local' };
  }

  let databaseName;
  try {
    databaseName = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  } catch {
    return { ok: false, reason: 'nombre de base no aislado' };
  }
  if (!databaseName || !/(test|ci|e2e)/i.test(databaseName)) {
    return { ok: false, reason: 'nombre de base no aislado' };
  }

  return { ok: true, reason: null };
}

const databaseUrl = process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL;
const guardResult = validarConfiguracionBaseAislada({
  databaseUrl: process.env.DATABASE_URL,
  configuredDatabaseUrl: databaseUrl,
  confirmation: process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM,
  isolated: process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED,
});
const enabled = guardResult.ok;
const testOptions = { skip: !enabled, concurrency: false };
const marker = `repo_040_${crypto.randomUUID()}`;

function config(url, overrides = {}) {
  return {
    databaseUrl: url,
    configuredDatabaseUrl: url,
    confirmation: 'ISOLATED',
    isolated: 'true',
    ...overrides,
  };
}

test('guarda acepta localhost con base test', () => {
  assert.equal(validarConfiguracionBaseAislada(config('postgres://localhost/repo_test')).ok, true);
});

test('guarda acepta 127.0.0.1 con base ci', () => {
  assert.equal(validarConfiguracionBaseAislada(config('postgresql://127.0.0.1/repo_ci')).ok, true);
});

test('guarda acepta ::1 con base e2e', () => {
  assert.equal(validarConfiguracionBaseAislada(config('postgresql://[::1]/repo_e2e')).ok, true);
});

test('guarda rechaza Railway', () => {
  const result = validarConfiguracionBaseAislada(config('postgresql://containers-us-west-1.railway.app/repo_test'));
  assert.equal(result.ok, false);
  assert.match(result.reason, /host no local/);
});

test('guarda rechaza una IP privada de red', () => {
  const result = validarConfiguracionBaseAislada(config('postgresql://192.168.1.10/repo_test'));
  assert.equal(result.ok, false);
  assert.match(result.reason, /host no local/);
});

test('guarda rechaza localhost sin marcador de aislamiento', () => {
  const result = validarConfiguracionBaseAislada(config('postgresql://localhost/production'));
  assert.equal(result.ok, false);
  assert.match(result.reason, /nombre de base no aislado/);
});

test('guarda rechaza confirmación incorrecta', () => {
  const result = validarConfiguracionBaseAislada(config('postgresql://localhost/repo_test', { confirmation: 'YES' }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /confirmación incorrecta/);
});

test('guarda rechaza URLs distintas', () => {
  const result = validarConfiguracionBaseAislada(config('postgresql://localhost/repo_test', {
    configuredDatabaseUrl: 'postgresql://localhost/otro_test',
  }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /URL ausente o distinta/);
});

function testName(suffix) {
  return `${marker}_${suffix}`;
}

async function createFixture(suffix) {
  const email = `${testName(suffix)}@test.local`;
  const user = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, role)
     VALUES ($1, $2, 'test-hash', 'alumno')
     RETURNING id`,
    [testName('user'), email],
  );
  const oposicion = await pool.query(
    `INSERT INTO oposiciones (nombre, slug, estado)
     VALUES ($1, $2, 'activa')
     RETURNING id`,
    [testName('oposicion'), testName(suffix)],
  );
  return { userId: user.rows[0].id, oposicionId: oposicion.rows[0].id };
}

async function cleanupFixture({ userId, oposicionId }) {
  await pool.query('DELETE FROM accesos_oposicion WHERE usuario_id = $1 AND oposicion_id = $2', [userId, oposicionId]);
  await pool.query('DELETE FROM usuarios WHERE id = $1', [userId]);
  await pool.query('DELETE FROM oposiciones WHERE id = $1', [oposicionId]);
}

async function getAccess(userId, oposicionId) {
  const result = await pool.query(
    `SELECT id, estado, modo_preparacion, modo_activo, precio_pagado, notas, fecha_inicio, fecha_fin
       FROM accesos_oposicion
      WHERE usuario_id = $1 AND oposicion_id = $2`,
    [userId, oposicionId],
  );
  return result.rows[0] ?? null;
}

async function getModels(accessId) {
  const result = await pool.query(
    'SELECT modelo FROM acceso_oposicion_modelos WHERE acceso_id = $1 ORDER BY modelo',
    [accessId],
  );
  return result.rows.map((row) => row.modelo);
}

test('repository crea acceso experto con un único modelo experto', testOptions, async () => {
  const fixture = await createFixture('create-experto');
  try {
    const access = await accesoOposicionRepository.crearAcceso({
      userId: fixture.userId,
      oposicionId: fixture.oposicionId,
      modoPreparacion: 'experto',
    });
    assert.equal(access.modo_preparacion, 'experto');
    assert.equal(access.modo_activo, 'experto');
    assert.deepEqual(await getModels(access.id), ['experto']);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('repository crea acceso albacer como guiado con un único modelo', testOptions, async () => {
  const fixture = await createFixture('create-albacer');
  try {
    const access = await accesoOposicionRepository.crearAcceso({
      userId: fixture.userId,
      oposicionId: fixture.oposicionId,
      modoPreparacion: 'albacer',
    });
    assert.equal(access.modo_preparacion, 'albacer');
    assert.equal(access.modo_activo, 'guiado');
    assert.deepEqual(await getModels(access.id), ['guiado']);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('repository cambia experto a albacer y vuelta sin conceder ambos modelos', testOptions, async () => {
  const fixture = await createFixture('switch-mode');
  try {
    await accesoOposicionRepository.crearAcceso({ ...fixture, modoPreparacion: 'experto' });
    await accesoOposicionRepository.updatePreparacion(fixture.userId, fixture.oposicionId, { modoPreparacion: 'albacer' });
    assert.deepEqual(await getModels((await getAccess(fixture.userId, fixture.oposicionId)).id), ['guiado']);
    await accesoOposicionRepository.updatePreparacion(fixture.userId, fixture.oposicionId, { modoPreparacion: 'experto' });
    assert.deepEqual(await getModels((await getAccess(fixture.userId, fixture.oposicionId)).id), ['experto']);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('updateAcceso administrativo conserva dos modelos', testOptions, async () => {
  const fixture = await createFixture('admin-preserves-models');
  try {
    const access = await accesoOposicionRepository.crearAcceso({ ...fixture, modoPreparacion: 'experto' });
    await pool.query('INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES ($1, $2)', [access.id, 'guiado']);
    const before = await getAccess(fixture.userId, fixture.oposicionId);
    await accesoOposicionRepository.updateAcceso(fixture.userId, fixture.oposicionId, { estado: 'activo' });
    const afterUpdate = await getAccess(fixture.userId, fixture.oposicionId);
    assert.equal(afterUpdate.notas, before.notas);
    assert.equal(afterUpdate.precio_pagado, before.precio_pagado);
    assert.equal(afterUpdate.fecha_inicio.toISOString(), before.fecha_inicio.toISOString());
    assert.equal(afterUpdate.fecha_fin, before.fecha_fin);
    assert.deepEqual(await getModels(access.id), ['experto', 'guiado']);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('repository reactiva expirado, pero rechaza revocado y cancelado', testOptions, async () => {
  for (const estado of ['expirado', 'revocado', 'cancelado']) {
    const fixture = await createFixture(`state-${estado}`);
    try {
      const access = await accesoOposicionRepository.crearAcceso({ ...fixture, modoPreparacion: 'experto' });
      await pool.query('UPDATE accesos_oposicion SET estado = $1 WHERE id = $2', [estado, access.id]);
      if (estado === 'expirado') {
        const renewed = await accesoOposicionRepository.crearAcceso({ ...fixture, fechaFin: new Date('2030-01-01T00:00:00Z') });
        assert.equal(renewed.estado, 'activo');
        assert.deepEqual(await getModels(access.id), ['albacer' === renewed.modo_preparacion ? 'guiado' : 'experto']);
      } else {
        await assert.rejects(
          () => accesoOposicionRepository.crearAcceso({ ...fixture, modoPreparacion: 'experto' }),
          new RegExp(`No se puede reactivar un acceso ${estado}`),
        );
        assert.equal((await getAccess(fixture.userId, fixture.oposicionId)).estado, estado);
        assert.deepEqual(await getModels(access.id), ['experto']);
      }
    } finally {
      await cleanupFixture(fixture);
    }
  }
});

test('repository conserva campos comerciales y vigencia al renovar sin nuevos valores', testOptions, async () => {
  const fixture = await createFixture('preserve-fields');
  try {
    const original = await accesoOposicionRepository.crearAcceso({
      ...fixture,
      fechaFin: new Date('2031-01-01T00:00:00Z'),
      precioPagado: 29,
      notas: 'nota original',
      modoPreparacion: 'experto',
    });
    await accesoOposicionRepository.crearAcceso({ ...fixture });
    const renewed = await getAccess(fixture.userId, fixture.oposicionId);
    assert.equal(renewed.precio_pagado, original.precio_pagado);
    assert.equal(renewed.notas, original.notas);
    assert.equal(renewed.fecha_inicio.toISOString(), original.fecha_inicio.toISOString());
    assert.equal(renewed.fecha_fin.toISOString(), original.fecha_fin.toISOString());
    assert.equal(renewed.modo_preparacion, 'experto');
  } finally {
    await cleanupFixture(fixture);
  }
});

test('fallo al insertar modelo revierte también el acceso', testOptions, async () => {
  const fixture = await createFixture('rollback-model');
  let otherFixture;
  const functionName = `fn_${marker.replaceAll('-', '_')}_fail_model`;
  const triggerName = `trg_${marker.replaceAll('-', '_')}_fail_model`;
  let targetAccess;
  try {
    otherFixture = await createFixture('rollback-model-other');
    const targetResult = await pool.query(
      `INSERT INTO accesos_oposicion
        (usuario_id, oposicion_id, estado, modo_preparacion, modo_activo)
       VALUES ($1, $2, 'activo', 'experto', 'experto')
       RETURNING id, estado, modo_preparacion, modo_activo, precio_pagado, notas, fecha_inicio, fecha_fin`,
      [fixture.userId, fixture.oposicionId],
    );
    targetAccess = targetResult.rows[0];
    const targetAccessId = BigInt(targetAccess.id).toString();
    await pool.query(`
      CREATE OR REPLACE FUNCTION ${functionName}()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.acceso_id = TG_ARGV[0]::BIGINT THEN
          RAISE EXCEPTION 'fallo de modelo simulado';
        END IF;
        RETURN NEW;
      END;
      $$`);
    await pool.query(`
      CREATE TRIGGER ${triggerName}
      BEFORE INSERT ON acceso_oposicion_modelos
      FOR EACH ROW EXECUTE FUNCTION ${functionName}('${targetAccessId}')`);

    const otherAccess = await accesoOposicionRepository.crearAcceso({
      ...otherFixture,
      modoPreparacion: 'experto',
    });
    assert.deepEqual(await getModels(otherAccess.id), ['experto']);

    await assert.rejects(
      () => accesoOposicionRepository.crearAcceso({ ...fixture, modoPreparacion: 'experto' }),
      /fallo de modelo simulado/,
    );
    assert.deepEqual(await getAccess(fixture.userId, fixture.oposicionId), targetAccess);
    assert.deepEqual(await getModels(targetAccess.id), []);
  } finally {
    await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON acceso_oposicion_modelos`);
    await pool.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
    await cleanupFixture(fixture);
    if (otherFixture) await cleanupFixture(otherFixture);
  }
});

before(async () => {
  if (enabled) await pool.query('SELECT 1');
});

after(async () => {
  await pool.end();
});
