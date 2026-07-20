import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import pool from '../../src/config/db.js';
import { createBillingService } from '../../src/services/billing.service.js';
import { createFakeStripe } from '../support/fakeStripe.js';
import { installRemoteNetworkBlock } from '../support/networkBlock.js';
import { assertStripeTestIsolation } from '../../src/utils/stripe-test-guards.js';

const WEBHOOK_SECRET = 'whsec_mock_only';
const SECRET_KEY = 'sk_test_mock_only';
const RUN_ID = `stripe_e2e_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function assertEnv() {
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.ALLOW_STRIPE_E2E, 'true');
  assert.equal(process.env.STRIPE_E2E_MODE, 'mock');
  assert.equal(process.env.E2E_DB_ISOLATED, 'true');
  assertStripeTestIsolation({ stripeSecretKey: SECRET_KEY });
}

function makePayload({
  eventId = `${RUN_ID}_evt_1`,
  sessionId = `${RUN_ID}_cs_1`,
  eventType = 'checkout.session.completed',
  livemode = false,
  metadata = null,
  amountTotal = 2900,
} = {}) {
  return JSON.stringify({
    id: eventId,
    type: eventType,
    livemode,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: sessionId,
        amount_total: amountTotal,
        metadata,
      },
    },
  });
}

function sign(payload, secret = WEBHOOK_SECRET) {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret });
}

async function createFixture() {
  const email = `${RUN_ID}@test.local`;
  const user = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, role)
     VALUES ($1, $2, $3, 'alumno')
     RETURNING id, email, nombre`,
    ['Stripe E2E', email, 'hash'],
  );
  const oposicion = await pool.query(
    `INSERT INTO oposiciones (nombre, descripcion, estado, slug, precio_mensual_cents)
     VALUES ($1, $2, 'activa', $3, $4)
     RETURNING id, nombre`,
    [`${RUN_ID} Oposicion`, 'Stripe E2E', RUN_ID, 2900],
  );
  return { user: user.rows[0], oposicion: oposicion.rows[0] };
}

function createService({ emailCalls, afterWebhookEventRegistered = null } = {}) {
  const fakeStripe = createFakeStripe({
    constructEvent(rawBody, signature, secret) {
      return Stripe.webhooks.constructEvent(rawBody, signature, secret);
    },
  });

  return createBillingService({
    stripeClientProvider: async () => fakeStripe,
    settingsService: {
      async getStripeConfig() {
        return { secretKey: SECRET_KEY, webhookSecret: WEBHOOK_SECRET };
      },
    },
    emailService: {
      async sendAccesoConfirmado(args) {
        emailCalls.push(args);
      },
    },
    authRepository: {
      async getUserById(userId) {
        return { id: userId, email: `${RUN_ID}@test.local`, nombre: 'Stripe E2E' };
      },
    },
    catalogRepository: {
      async getOposiciones() {
        return [{ id: Number(globalThis.__stripeFixture.oposicion.id), nombre: globalThis.__stripeFixture.oposicion.nombre }];
      },
    },
    awaitEmailsForTests: true,
    afterWebhookEventRegistered,
  });
}

async function countRows(table, where, params) {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${where}`, params);
  return result.rows[0].count;
}

async function getAccess(userId, oposicionId) {
  const result = await pool.query(
    `SELECT id, fecha_fin, stripe_session_id, precio_pagado
     FROM accesos_oposicion
     WHERE usuario_id = $1 AND oposicion_id = $2`,
    [userId, oposicionId],
  );
  return result.rows[0] ?? null;
}

async function cleanup() {
  if (!globalThis.__stripeFixture) return;
  const { user, oposicion } = globalThis.__stripeFixture;
  await pool.query('DELETE FROM stripe_webhook_events WHERE event_id LIKE $1 OR object_id LIKE $1', [`${RUN_ID}%`]);
  await pool.query('DELETE FROM accesos_oposicion WHERE usuario_id = $1 OR oposicion_id = $2', [user.id, oposicion.id]);
  await pool.query('DELETE FROM oposiciones WHERE id = $1', [oposicion.id]);
  await pool.query('DELETE FROM usuarios WHERE id = $1', [user.id]);
}

test.before(async () => {
  assertEnv();
  globalThis.__stripeFixture = await createFixture();
});

test.after(async () => {
  await cleanup();
  await pool.end();
});

test('webhook rechaza ausencia de firma, firma incorrecta y payload alterado sin escrituras', async () => {
  const network = installRemoteNetworkBlock();
  const emailCalls = [];
  const service = createService({ emailCalls });
  const { user, oposicion } = globalThis.__stripeFixture;
  const metadata = { userId: String(user.id), oposicionId: String(oposicion.id) };
  const payload = makePayload({ eventId: `${RUN_ID}_evt_bad_sig`, sessionId: `${RUN_ID}_cs_bad_sig`, metadata });

  try {
    await assert.rejects(() => service.procesarWebhook(Buffer.from(payload), undefined), /Firma del webhook invalida/);
    await assert.rejects(() => service.procesarWebhook(Buffer.from(payload), 'bad'), /Firma del webhook invalida/);
    const signature = sign(payload);
    const altered = payload.replace('2900', '3900');
    await assert.rejects(() => service.procesarWebhook(Buffer.from(altered), signature), /Firma del webhook invalida/);

    assert.equal(await countRows('stripe_webhook_events', 'event_id = $1', [`${RUN_ID}_evt_bad_sig`]), 0);
    assert.equal(await getAccess(user.id, oposicion.id), null);
    assert.equal(emailCalls.length, 0);
    assert.deepEqual(network.blockedHosts, []);
  } finally {
    network.restore();
  }
});

test('webhook valido crea acceso, registra evento y envia un unico email', async () => {
  const network = installRemoteNetworkBlock();
  const emailCalls = [];
  const service = createService({ emailCalls });
  const { user, oposicion } = globalThis.__stripeFixture;
  const metadata = { userId: String(user.id), oposicionId: String(oposicion.id) };
  const eventId = `${RUN_ID}_evt_valid`;
  const sessionId = `${RUN_ID}_cs_valid`;
  const payload = makePayload({ eventId, sessionId, metadata });

  try {
    const result = await service.procesarWebhook(Buffer.from(payload), sign(payload));
    const access = await getAccess(user.id, oposicion.id);

    assert.equal(result.processed, true);
    assert.ok(access);
    assert.equal(access.stripe_session_id, sessionId);
    assert.equal(Number(access.precio_pagado), 29);
    assert.equal(await countRows('stripe_webhook_events', 'event_id = $1 AND processed_at IS NOT NULL', [eventId]), 1);
    assert.equal(emailCalls.length, 1);
    assert.deepEqual(network.blockedHosts, []);
  } finally {
    network.restore();
  }
});

test('mismo event.id repetido no extiende acceso ni reenvia email', async () => {
  const emailCalls = [];
  const service = createService({ emailCalls });
  const { user, oposicion } = globalThis.__stripeFixture;
  const metadata = { userId: String(user.id), oposicionId: String(oposicion.id) };
  const eventId = `${RUN_ID}_evt_repeat`;
  const sessionId = `${RUN_ID}_cs_repeat`;
  const payload = makePayload({ eventId, sessionId, metadata });
  const signature = sign(payload);

  const first = await service.procesarWebhook(Buffer.from(payload), signature);
  const accessAfterFirst = await getAccess(user.id, oposicion.id);
  const second = await service.procesarWebhook(Buffer.from(payload), signature);
  const accessAfterSecond = await getAccess(user.id, oposicion.id);

  assert.equal(first.processed, true);
  assert.deepEqual(second, { processed: false, duplicate: true });
  assert.equal(accessAfterSecond.fecha_fin.toISOString(), accessAfterFirst.fecha_fin.toISOString());
  assert.equal(await countRows('stripe_webhook_events', 'event_id = $1', [eventId]), 1);
  assert.equal(emailCalls.length, 1);
});

test('distinto event.id con misma session se trata como duplicado funcional', async () => {
  const emailCalls = [];
  const service = createService({ emailCalls });
  const { user, oposicion } = globalThis.__stripeFixture;
  const metadata = { userId: String(user.id), oposicionId: String(oposicion.id) };
  const sessionId = `${RUN_ID}_cs_functional`;
  const firstPayload = makePayload({ eventId: `${RUN_ID}_evt_functional_1`, sessionId, metadata });
  const secondPayload = makePayload({ eventId: `${RUN_ID}_evt_functional_2`, sessionId, metadata });

  await service.procesarWebhook(Buffer.from(firstPayload), sign(firstPayload));
  const accessAfterFirst = await getAccess(user.id, oposicion.id);
  const second = await service.procesarWebhook(Buffer.from(secondPayload), sign(secondPayload));
  const accessAfterSecond = await getAccess(user.id, oposicion.id);

  assert.deepEqual(second, { processed: false, duplicate: true });
  assert.equal(accessAfterSecond.fecha_fin.toISOString(), accessAfterFirst.fecha_fin.toISOString());
  assert.equal(await countRows('stripe_webhook_events', 'object_id = $1', [sessionId]), 1);
  assert.equal(emailCalls.length, 1);
});

test('duplicados concurrentes del mismo evento tienen una sola escritura funcional', async () => {
  const emailCalls = [];
  const service = createService({ emailCalls });
  const { user, oposicion } = globalThis.__stripeFixture;
  const metadata = { userId: String(user.id), oposicionId: String(oposicion.id) };
  const eventId = `${RUN_ID}_evt_concurrent`;
  const sessionId = `${RUN_ID}_cs_concurrent`;
  const payload = makePayload({ eventId, sessionId, metadata });
  const signature = sign(payload);

  const results = await Promise.all([
    service.procesarWebhook(Buffer.from(payload), signature),
    service.procesarWebhook(Buffer.from(payload), signature),
  ]);

  assert.equal(results.filter((item) => item.processed).length, 1);
  assert.equal(results.filter((item) => item.duplicate).length, 1);
  assert.equal(await countRows('stripe_webhook_events', 'event_id = $1', [eventId]), 1);
  assert.equal(await countRows('accesos_oposicion', 'usuario_id = $1 AND oposicion_id = $2', [user.id, oposicion.id]), 1);
  assert.equal(emailCalls.length, 1);
});

test('fallo despues de registrar evento hace rollback y permite reintento correcto', async () => {
  const emailCalls = [];
  const { user, oposicion } = globalThis.__stripeFixture;
  const metadata = { userId: String(user.id), oposicionId: String(oposicion.id) };
  const eventId = `${RUN_ID}_evt_rollback`;
  const sessionId = `${RUN_ID}_cs_rollback`;
  const payload = makePayload({ eventId, sessionId, metadata });
  const signature = sign(payload);
  const failingService = createService({
    emailCalls,
    afterWebhookEventRegistered: async () => {
      throw new Error('fallo transaccional simulado');
    },
  });

  await assert.rejects(
    () => failingService.procesarWebhook(Buffer.from(payload), signature),
    /fallo transaccional simulado/,
  );
  assert.equal(await countRows('stripe_webhook_events', 'event_id = $1', [eventId]), 0);
  assert.equal(await countRows('accesos_oposicion', 'stripe_session_id = $1', [sessionId]), 0);
  assert.equal(emailCalls.length, 0);

  const service = createService({ emailCalls });
  const retry = await service.procesarWebhook(Buffer.from(payload), signature);

  assert.equal(retry.processed, true);
  assert.equal(await countRows('stripe_webhook_events', 'event_id = $1 AND processed_at IS NOT NULL', [eventId]), 1);
  assert.equal(await countRows('accesos_oposicion', 'stripe_session_id = $1', [sessionId]), 1);
  assert.equal(emailCalls.length, 1);
});

test('evento desconocido firmado devuelve 2xx logico sin cambios funcionales', async () => {
  const emailCalls = [];
  const service = createService({ emailCalls });
  const payload = makePayload({
    eventId: `${RUN_ID}_evt_unknown`,
    sessionId: `${RUN_ID}_cs_unknown`,
    eventType: 'checkout.session.expired',
    metadata: {},
  });

  const result = await service.procesarWebhook(Buffer.from(payload), sign(payload));

  assert.deepEqual(result, { processed: false, ignored: true });
  assert.equal(await countRows('stripe_webhook_events', 'event_id = $1', [`${RUN_ID}_evt_unknown`]), 0);
  assert.equal(emailCalls.length, 0);
});

test('metadata invalida y livemode=true se rechazan sin acceso ni email', async () => {
  const emailCalls = [];
  const service = createService({ emailCalls });
  const invalidPayload = makePayload({
    eventId: `${RUN_ID}_evt_bad_metadata`,
    sessionId: `${RUN_ID}_cs_bad_metadata`,
    metadata: { userId: 'x', oposicionId: '' },
  });
  const livePayload = makePayload({
    eventId: `${RUN_ID}_evt_live`,
    sessionId: `${RUN_ID}_cs_live`,
    livemode: true,
    metadata: { userId: '1', oposicionId: '1' },
  });

  await assert.rejects(
    () => service.procesarWebhook(Buffer.from(invalidPayload), sign(invalidPayload)),
    /userId invalido/,
  );
  await assert.rejects(
    () => service.procesarWebhook(Buffer.from(livePayload), sign(livePayload)),
    /livemode=true/,
  );

  assert.equal(await countRows('stripe_webhook_events', 'event_id IN ($1, $2)', [`${RUN_ID}_evt_bad_metadata`, `${RUN_ID}_evt_live`]), 0);
  assert.equal(emailCalls.length, 0);
});
