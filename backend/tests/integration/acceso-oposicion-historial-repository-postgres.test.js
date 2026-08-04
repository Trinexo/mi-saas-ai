import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pool from '../../src/config/db.js';
import { accesoOposicionHistorialRepository as repository } from '../../src/repositories/accesoOposicionHistorial.repository.js';

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
  throw new Error(`Suite PostgreSQL de historial no aislada: ${guard.reason}`);
}
if (!isCi && !hasAnyConfiguration) console.warn('[skip] Suite PostgreSQL de historial: no hay configuración aislada');
const options = { skip: !guard.ok, concurrency: false };
const marker = `history_repo_${crypto.randomUUID()}`;

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

const snapshot = {
  estado: 'activo',
  modoActivo: 'experto',
  modelos: ['experto'],
  vigencia: { fechaInicio: '2026-08-01', fechaFin: '2026-08-31' },
};

function adminEvent(tipoEvento, fixture, extra = {}) {
  return {
    accesoId: fixture.accesoId,
    tipoEvento,
    anterior: snapshot,
    nuevo: { ...snapshot, modoActivo: 'guiado', modelos: ['guiado'] },
    actorUsuarioId: fixture.userId,
    motivo: 'prueba de repositorio',
    metadata: { origen: 'test', proceso: 'historial-repository' },
    ...extra,
  };
}

test('historial acepta IDs BIGINT y no pierde precisión en respuestas', options, async () => {
  const largeId = '9007199254740993';
  const largeActorId = '9007199254740994';
  const maxBigInt = '9223372036854775807';
  const aboveMaxBigInt = '9223372036854775808';
  const calls = [];
  const row = {
    id: largeId,
    acceso_id: '42',
    tipo_evento: 'revocado',
    estado_anterior: 'activo',
    estado_nuevo: 'revocado',
    modo_activo_anterior: 'experto',
    modo_activo_nuevo: 'experto',
    modelos_anteriores: ['experto'],
    modelos_nuevos: ['experto'],
    actor_usuario_id: largeActorId,
    motivo: 'motivo',
    metadata: { origen: 'test' },
    creado_en: '2026-08-01T00:00:00.000Z',
  };
  const client = {
    query: async (...args) => {
      calls.push(args);
      return { rows: [row], rowCount: 1 };
    },
  };
  const event = await repository.insertarEvento({
    accesoId: '42',
    tipoEvento: 'revocado',
    anterior: snapshot,
    nuevo: { ...snapshot, estado: 'revocado' },
    actorUsuarioId: largeActorId,
    motivo: 'motivo',
    metadata: { origen: 'test' },
  }, client);

  assert.equal(calls[0][1][0], '42');
  assert.equal(calls[0][1][8], largeActorId);
  assert.equal(event.id, largeId);
  assert.equal(event.accesoId, 42);
  assert.equal(event.actorUsuarioId, largeActorId);
  await repository.listarPorAcceso(maxBigInt, client);
  assert.equal(calls.at(-1)[1][0], maxBigInt);
  await assert.rejects(
    () => repository.listarPorAcceso(aboveMaxBigInt, client),
    /accesoId debe ser un entero positivo/,
  );

  for (const invalid of [null, undefined, '', '0', '-1', '1.5', '1e3', Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(
      () => repository.listarPorAcceso(invalid, client),
      /accesoId debe ser un entero positivo/,
    );
  }
  await assert.rejects(
    () => repository.insertarEvento({
      accesoId: '42',
      tipoEvento: 'revocado',
      anterior: snapshot,
      nuevo: { ...snapshot, estado: 'revocado' },
      actorUsuarioId: Number.MAX_SAFE_INTEGER + 1,
      motivo: 'motivo',
      metadata: { origen: 'test' },
    }, client),
    /actorUsuarioId debe ser un entero positivo/,
  );
  await repository.insertarEvento({
    accesoId: maxBigInt,
    tipoEvento: 'revocado',
    anterior: snapshot,
    nuevo: { ...snapshot, estado: 'revocado' },
    actorUsuarioId: maxBigInt,
    motivo: 'motivo',
    metadata: { origen: 'test' },
  }, client);
  assert.equal(calls.at(-1)[1][0], maxBigInt);
  assert.equal(calls.at(-1)[1][8], maxBigInt);
  await assert.rejects(
    () => repository.insertarEvento({
      accesoId: '42',
      tipoEvento: 'revocado',
      anterior: snapshot,
      nuevo: { ...snapshot, estado: 'revocado' },
      actorUsuarioId: aboveMaxBigInt,
      motivo: 'motivo',
      metadata: { origen: 'test' },
    }, client),
    /actorUsuarioId debe ser un entero positivo/,
  );
});

test('historial inserta eventos canónicos, aliases y round-trip de vigencia', options, async () => withTransaction('events', async (client, fixture) => {
  const tipos = [
    'acceso_creado', 'modelos_modificados', 'modo_activo_cambiado',
    'vigencia_modificada', 'renovado', 'revocado', 'cancelado', 'reactivado',
  ];
  for (const tipoEvento of tipos) {
    const evento = tipoEvento === 'acceso_creado'
      ? { ...adminEvent(tipoEvento, fixture), anterior: null }
      : adminEvent(tipoEvento, fixture);
    await repository.insertarEvento(
      tipoEvento === 'modo_activo_cambiado'
        ? adminEvent(tipoEvento, fixture, { motivo: undefined })
        : evento,
      client,
    );
  }
  await repository.insertarEvento({
    accesoId: fixture.accesoId,
    tipoEvento: 'expirado',
    anterior: snapshot,
    nuevo: { ...snapshot, estado: 'expirado' },
    actorUsuarioId: null,
    metadata: { origen: 'sistema', proceso: 'test-expiracion' },
  }, client);
  const events = await repository.listarPorAcceso(fixture.accesoId, client);
  assert.deepEqual(events.map((event) => event.tipoEvento), [...tipos, 'expirado']);
  assert.equal(events[0].anterior, null);
  assert.deepEqual(events[0].nuevo.vigencia, snapshot.vigencia);
  assert.deepEqual(events[1].anterior.vigencia, snapshot.vigencia);
  assert.deepEqual(events[0].metadata, { origen: 'test', proceso: 'historial-repository' });
  assert.equal(Object.hasOwn(events[0].metadata, 'vigencia'), false);
  const persisted = await client.query(
    `SELECT tipo_evento FROM accesos_oposicion_historial
      WHERE acceso_id = $1 ORDER BY id ASC`,
    [fixture.accesoId],
  );
  assert.deepEqual(persisted.rows.slice(0, 4).map((row) => row.tipo_evento), [
    'creado', 'modelos_actualizados', 'modo_activo_cambiado', 'vigencia_actualizada',
  ]);
}));

test('historial conserva migracion_legacy existente pero no permite insertarla', options, async () => withTransaction('legacy', async (client, fixture) => {
  await client.query(
    `INSERT INTO accesos_oposicion_historial
      (acceso_id, tipo_evento, modelos_anteriores, modelos_nuevos, metadata)
     VALUES ($1, 'migracion_legacy', $2::jsonb, $3::jsonb, $4::jsonb)`,
    [fixture.accesoId, JSON.stringify(['experto']), JSON.stringify(['experto']), JSON.stringify({ origen: 'baseline' })],
  );
  await assert.rejects(
    () => repository.insertarEvento({ accesoId: fixture.accesoId, tipoEvento: 'migracion_legacy' }, client),
    /solo puede leerse/,
  );
  const events = await repository.listarPorAcceso(fixture.accesoId, client);
  assert.equal(events[0].tipoEvento, 'migracion_legacy');
}));

test('historial valida actor, motivo normalizado y metadatos reservados', options, async () => withTransaction('validation', async (client, fixture) => {
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { actorUsuarioId: null }), client), /requiere actor/);
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { motivo: '  ' }), client), /motivo no vacío/);
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { metadata: { vigencia: {} } }), client), /metadata.vigencia/);
  const created = await repository.insertarEvento(adminEvent('revocado', fixture, { motivo: '  motivo normalizado  ' }), client);
  assert.equal(created.motivo, 'motivo normalizado');
  await assert.rejects(() => repository.insertarEvento({ ...adminEvent('modo_activo_cambiado', fixture), motivo: undefined, actorUsuarioId: null }, client), /requiere actor/);
  await assert.rejects(() => repository.insertarEvento({ accesoId: fixture.accesoId, tipoEvento: 'desconocido' }, client), /catálogo canónico/);
}));

test('historial valida expirado con actor null y metadata de sistema', options, async () => withTransaction('expired', async (client, fixture) => {
  const event = {
    accesoId: fixture.accesoId,
    tipoEvento: 'expirado',
    anterior: snapshot,
    nuevo: { ...snapshot, estado: 'expirado' },
    actorUsuarioId: null,
    metadata: { origen: 'sistema' },
  };
  const created = await repository.insertarEvento(event, client);
  assert.equal(created.tipoEvento, 'expirado');
  await assert.rejects(() => repository.insertarEvento({ ...event, actorUsuarioId: fixture.userId }, client), /actorUsuario_id null/);
  await assert.rejects(() => repository.insertarEvento({ ...event, metadata: null }, client), /requiere metadata con origen sistema/);
}));

test('historial rechaza snapshots desconocidos, estados y modos inválidos', options, async () => withTransaction('snapshot-validation', async (client, fixture) => {
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { anterior: { campo: true } }), client), /campo desconocido/);
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { nuevo: { estado: 'desconocido' } }), client), /estado no es válido/);
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { nuevo: { modoActivo: 'albacer' } }), client), /modoActivo no es canónico/);
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { nuevo: { modelos: ['guiado', 'guiado'] } }), client), /duplicados/);
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { anterior: {} }), client), /objeto vacío/);
  await assert.rejects(() => repository.insertarEvento(adminEvent('revocado', fixture, { nuevo: {} }), client), /objeto vacío/);
}));

test('acceso_creado conserva anterior null y rechaza nuevo null', options, async () => withTransaction('null-snapshots', async (client, fixture) => {
  const created = await repository.insertarEvento({
    ...adminEvent('acceso_creado', fixture),
    anterior: null,
  }, client);
  assert.equal(created.anterior, null);
  assert.notEqual(created.nuevo, null);
  await assert.rejects(
    () => repository.insertarEvento({ ...adminEvent('revocado', fixture), nuevo: null }, client),
    /requiere snapshots anterior y nuevo/,
  );
}));

test('historial ordena por creado_en e id y aísla por acceso', options, async () => {
  await withTransaction('order-a', async (client, first) => {
    await withTransaction('order-b', async (otherClient, second) => {
      await repository.insertarEvento(adminEvent('acceso_creado', first, { anterior: null }), client);
      await repository.insertarEvento(adminEvent('renovado', first), client);
      await repository.insertarEvento(adminEvent('acceso_creado', second, { anterior: null }), otherClient);
      const firstEvents = await repository.listarPorAcceso(first.accesoId, client);
      const secondEvents = await repository.listarPorAcceso(second.accesoId, otherClient);
      assert.equal(firstEvents.length, 2);
      assert.equal(secondEvents.length, 1);
      assert.ok(firstEvents[0].id < firstEvents[1].id);
    });
  });
});

test('historial participa en rollback externo y no expone update/delete', options, async () => withTransaction('rollback', async (client, fixture) => {
  assert.equal('actualizarEvento' in repository, false);
  assert.equal('eliminarEvento' in repository, false);
  await client.query('SAVEPOINT event_rollback');
  await repository.insertarEvento(adminEvent('acceso_creado', fixture, { anterior: null }), client);
  await client.query('ROLLBACK TO SAVEPOINT event_rollback');
  assert.deepEqual(await repository.listarPorAcceso(fixture.accesoId, client), []);
}));

test('historial respeta el trigger de inmutabilidad dentro de la transacción', options, async () => withTransaction('immutable', async (client, fixture) => {
  const event = await repository.insertarEvento(adminEvent('acceso_creado', fixture, { anterior: null }), client);
  await client.query('SAVEPOINT update_attempt');
  await assert.rejects(
    () => client.query('UPDATE accesos_oposicion_historial SET motivo = $1 WHERE id = $2', ['cambio', event.id]),
    /inmutable/,
  );
  await client.query('ROLLBACK TO SAVEPOINT update_attempt');
  await client.query('SAVEPOINT delete_attempt');
  await assert.rejects(
    () => client.query('DELETE FROM accesos_oposicion_historial WHERE id = $1', [event.id]),
    /inmutable/,
  );
  await client.query('ROLLBACK TO SAVEPOINT delete_attempt');
}));

before(async () => { if (guard.ok) await pool.query('SELECT 1'); });
after(async () => { await pool.end(); });
