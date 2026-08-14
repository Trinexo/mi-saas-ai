import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pool from '../../src/config/db.js';
import { createAccessBillingService } from '../../src/services/accessBilling.service.js';
import { accesoOposicionHistorialRepository } from '../../src/repositories/accesoOposicionHistorial.repository.js';

function guard() {
  const url = process.env.DATABASE_URL;
  const configured = process.env.MIGRATION_040_REPOSITORY_TEST_DATABASE_URL;
  const isolated = process.env.MIGRATION_040_REPOSITORY_TEST_ISOLATED === 'true';
  const confirm = process.env.MIGRATION_040_REPOSITORY_TEST_CONFIRM === 'ISOLATED';
  if (!url && !configured && !process.env.CI) return false;
  if (!url || url !== configured || !isolated || !confirm) throw new Error('Suite PR8 PostgreSQL no aislada');
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const database = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
  if (!['localhost', '127.0.0.1', '::1'].includes(host) || !/(test|ci|e2e)/i.test(database)) {
    throw new Error('Suite PR8 PostgreSQL requiere base local aislada');
  }
  return true;
}

const enabled = guard();
const options = { skip: !enabled, concurrency: false };
const marker = `billing_repo_${crypto.randomUUID()}`;

async function withTransaction(suffix, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, role)
       VALUES ($1, $2, 'test-hash', 'alumno') RETURNING id`,
      [`${marker}_${suffix}`, `${marker}_${suffix}@test.local`],
    );
    const opposition = await client.query(
      `INSERT INTO oposiciones (nombre, slug, estado)
       VALUES ($1, $2, 'activa') RETURNING id`,
      [`${marker}_${suffix}`, `${marker}_${suffix}`],
    );
    return await callback(client, { userId: user.rows[0].id, oposicionId: opposition.rows[0].id });
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}

function service({ historialRepository = accesoOposicionHistorialRepository } = {}) {
  return createAccessBillingService({ historialRepository, clock: () => new Date('2026-08-01T00:00:00.000Z') });
}

const args = (fixture, client, eventId = `${marker}_evt`) => ({
  usuarioId: fixture.userId,
  oposicionId: fixture.oposicionId,
  fechaInicio: '2026-08-01T00:00:00Z',
  fechaFin: '2026-09-01T00:00:00Z',
  precioPagado: 29,
  notas: 'Stripe test',
  modelos: ['guiado'],
  modoActivo: 'guiado',
  stripeEventId: eventId,
  client,
});

const argsWith = (fixture, client, eventId, overrides = {}) => ({
  ...args(fixture, client, eventId),
  ...overrides,
});

test('PR8 crea acceso y evento Stripe persistido sin actor', options, async () => withTransaction('create', async (client, fixture) => {
  const result = await service().grantOrRenewAccessFromBilling(args(fixture, client, `${marker}_create`));
  const event = await client.query(
    `SELECT tipo_evento, actor_usuario_id, metadata
       FROM accesos_oposicion_historial WHERE acceso_id = $1`,
    [result.accesoId],
  );
  assert.equal(result.operacion, 'concesion');
  assert.equal(event.rows[0].tipo_evento, 'creado');
  assert.equal(event.rows[0].actor_usuario_id, null);
  assert.equal(event.rows[0].metadata.tipoActor, 'sistema');
  assert.equal(event.rows[0].metadata.origen, 'stripe');
  assert.equal(event.rows[0].metadata.operacion, 'concesion');
}));

test('PR8 conserva la eleccion al renovar con ambos modelos solicitados por Stripe', options, async () => withTransaction('renew-choice', async (client, fixture) => {
  const access = await client.query(
    `INSERT INTO accesos_oposicion
      (usuario_id, oposicion_id, estado, fecha_inicio, fecha_fin, modo_preparacion, modo_activo)
     VALUES ($1, $2, 'activo', '2026-01-01', '2026-01-15', 'albacer', 'guiado') RETURNING id`,
    [fixture.userId, fixture.oposicionId],
  );
  await client.query('INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES ($1, $2)', [access.rows[0].id, 'guiado']);
  const result = await service().grantOrRenewAccessFromBilling(argsWith(fixture, client, `${marker}_renew-choice`, {
    modelos: ['experto', 'guiado'],
    modoActivo: null,
  }));
  const row = await client.query('SELECT estado, modo_activo, modo_preparacion FROM accesos_oposicion WHERE id = $1', [result.accesoId]);
  const models = await client.query('SELECT modelo FROM acceso_oposicion_modelos WHERE acceso_id = $1 ORDER BY modelo', [result.accesoId]);
  assert.equal(row.rows[0].estado, 'activo');
  assert.equal(row.rows[0].modo_activo, 'guiado');
  assert.equal(row.rows[0].modo_preparacion, 'albacer');
  assert.deepEqual(models.rows.map((item) => item.modelo), ['guiado']);
}));

test('PR8 repite el mismo stripeEventId sin duplicar historial', options, async () => withTransaction('idempotent', async (client, fixture) => {
  const billing = service();
  const input = args(fixture, client, `${marker}_same`);
  await billing.grantOrRenewAccessFromBilling(input);
  const second = await billing.grantOrRenewAccessFromBilling(input);
  const count = await client.query(
    `SELECT COUNT(*)::int AS total FROM accesos_oposicion_historial
      WHERE acceso_id = $1 AND metadata->>'stripeEventId' = $2`,
    [second.accesoId, input.stripeEventId],
  );
  assert.equal(second.idempotente, true);
  assert.equal(count.rows[0].total, 1);
}));

test('PR8 renueva un acceso expirado con evento renovado', options, async () => withTransaction('renew', async (client, fixture) => {
  const access = await client.query(
    `INSERT INTO accesos_oposicion
      (usuario_id, oposicion_id, estado, fecha_inicio, fecha_fin, modo_preparacion, modo_activo)
     VALUES ($1, $2, 'activo', '2026-01-01', '2026-01-15', 'albacer', 'guiado') RETURNING id`,
    [fixture.userId, fixture.oposicionId],
  );
  await client.query('INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES ($1, $2)', [access.rows[0].id, 'guiado']);
  const result = await service().grantOrRenewAccessFromBilling(args(fixture, client, `${marker}_renew`));
  const event = await client.query('SELECT tipo_evento, actor_usuario_id FROM accesos_oposicion_historial WHERE acceso_id = $1', [result.accesoId]);
  assert.equal(result.operacion, 'renovacion');
  assert.equal(event.rows[0].tipo_evento, 'renovado');
  assert.equal(event.rows[0].actor_usuario_id, null);
}));

test('PR8 no reactiva revocado ni cancelado', options, async () => {
  for (const estado of ['revocado', 'cancelado']) {
    await withTransaction(estado, async (client, fixture) => {
      await client.query(
        `INSERT INTO accesos_oposicion
          (usuario_id, oposicion_id, estado, modo_preparacion, modo_activo)
         VALUES ($1, $2, $3, 'albacer', 'guiado')`,
        [fixture.userId, fixture.oposicionId, estado],
      );
      await assert.rejects(
        () => service().grantOrRenewAccessFromBilling(args(fixture, client, `${marker}_${estado}`)),
        (error) => error.code === 'ACCESS_BILLING_TERMINAL_STATE',
      );
    });
  }
});

test('PR8 conserva migracion_legacy y expirado de sistema', options, async () => withTransaction('system-events', async (client, fixture) => {
  const access = await client.query(
    `INSERT INTO accesos_oposicion (usuario_id, oposicion_id, estado, modo_preparacion, modo_activo)
     VALUES ($1, $2, 'activo', 'albacer', 'guiado') RETURNING id`,
    [fixture.userId, fixture.oposicionId],
  );
  await client.query('INSERT INTO acceso_oposicion_modelos (acceso_id, modelo) VALUES ($1, $2)', [access.rows[0].id, 'guiado']);
  await client.query(
    `INSERT INTO accesos_oposicion_historial (acceso_id, tipo_evento, modelos_nuevos, metadata)
     VALUES ($1, 'migracion_legacy', $2::jsonb, $3::jsonb)`,
    [access.rows[0].id, JSON.stringify(['guiado']), JSON.stringify({ origin: 'system', process: 'migration_040' })],
  );
  await client.query(
    `INSERT INTO accesos_oposicion_historial (acceso_id, tipo_evento, estado_anterior, estado_nuevo, metadata)
     VALUES ($1, 'expirado', 'activo', 'expirado', $2::jsonb)`,
    [access.rows[0].id, JSON.stringify({ origen: 'sistema', proceso: 'expiracion' })],
  );
}));

test('PR8 actor nulo en evento humano se rechaza', options, async () => withTransaction('human-actor', async (client, fixture) => {
  await assert.rejects(
    () => accesoOposicionHistorialRepository.insertarEvento({
      accesoId: fixture.oposicionId,
      tipoEvento: 'revocado',
      anterior: { estado: 'activo', modoActivo: 'guiado', modelos: ['guiado'] },
      nuevo: { estado: 'revocado', modoActivo: 'guiado', modelos: ['guiado'] },
      actorUsuarioId: null,
      motivo: 'humano',
      metadata: { origen: 'test' },
    }, client),
    /requiere actor/,
  );
}));

after(async () => { await pool.end(); });
