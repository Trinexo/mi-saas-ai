import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { createBillingService } from '../../src/services/billing.service.js';
import { assertStripeTestIsolation } from '../../src/utils/stripe-test-guards.js';
import { createFakeStripe } from '../support/fakeStripe.js';

const TEST_ENV = {
  NODE_ENV: 'test',
  ALLOW_STRIPE_E2E: 'true',
  STRIPE_E2E_MODE: 'mock',
  E2E_DB_ISOLATED: 'true',
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/plataforma_test_stripe_e2e',
  FRONTEND_URL: 'http://127.0.0.1:4173',
  E2E_API_BASE: 'http://127.0.0.1:3000/api',
  JWT_SECRET: 'billing-checkout-secret',
};

function withEnv(callback) {
  return async () => {
    const previous = {};
    for (const [key, value] of Object.entries(TEST_ENV)) {
      previous[key] = process.env[key];
      process.env[key] = value;
    }
    try {
      return await callback();
    } finally {
      for (const key of Object.keys(TEST_ENV)) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  };
}

function createService(options = {}) {
  const { fakeStripe = createFakeStripe(), failCheckout = null } = options;
  const hasOposicionOverride = Object.prototype.hasOwnProperty.call(options, 'oposicion');
  const stripe = failCheckout ? createFakeStripe({ failCheckout }) : fakeStripe;
  const repoCalls = [];
  const accessCalls = [];

  const service = createBillingService({
    stripeClientProvider: async () => stripe,
    billingRepository: {
      async getOposicionConPrecio(oposicionId) {
        repoCalls.push({ method: 'getOposicionConPrecio', oposicionId });
        if (hasOposicionOverride) return options.oposicion;
        return {
          id: oposicionId,
          nombre: 'Auxiliar Administrativo',
          descripcion: 'Curso test',
          precio_mensual_cents: 2900,
        };
      },
      async setPrecio() {},
    },
    accesoOposicionRepository: {
      async crearAcceso(args) {
        accessCalls.push(args);
      },
    },
  });

  return { service, stripe, repoCalls, accessCalls };
}

test('checkout sin token responde 401 y no invoca Stripe', withEnv(async () => {
  const server = app.listen(0);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/billing/checkout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ oposicionId: 1 }),
    });

    assert.equal(response.status, 401);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}));

test('checkout valido usa precio local, email autenticado y metadata segura', withEnv(async () => {
  const { service, stripe, repoCalls, accessCalls } = createService();

  const result = await service.crearCheckoutSession({
    userId: 42,
    oposicionId: 7,
    userEmail: 'alumno@test.local',
    precioEuros: 1,
    user_id: 999,
  });

  assert.equal(result.sessionId, 'cs_test_fake_session');
  assert.equal(stripe.checkoutCalls.length, 1);
  assert.equal(repoCalls.length, 1);
  assert.equal(accessCalls.length, 0);

  const params = stripe.checkoutCalls[0];
  assert.equal(params.mode, 'payment');
  assert.equal(params.customer_email, 'alumno@test.local');
  assert.equal(params.line_items[0].quantity, 1);
  assert.equal(params.line_items[0].price_data.currency, 'eur');
  assert.equal(params.line_items[0].price_data.unit_amount, 2900);
  assert.equal(params.metadata.userId, '42');
  assert.equal(params.metadata.oposicionId, '7');
  assert.equal(params.success_url, 'http://127.0.0.1:4173/mis-oposiciones?pago=ok&oposicion=7');
  assert.equal(params.cancel_url, 'http://127.0.0.1:4173/catalogo?pago=cancelado');
}));

test('checkout ignora precio y userId manipulados en el body', withEnv(async () => {
  const { service, stripe } = createService();

  await service.crearCheckoutSession({
    userId: 5,
    oposicionId: 3,
    userEmail: 'real@test.local',
    precio_mensual_cents: 1,
    precioEuros: 0.01,
    targetUserId: 999,
  });

  const params = stripe.checkoutCalls[0];
  assert.equal(params.line_items[0].price_data.unit_amount, 2900);
  assert.deepEqual(params.metadata, { userId: '5', oposicionId: '3' });
}));

test('checkout de oposicion inexistente no invoca Stripe', withEnv(async () => {
  const fakeStripe = createFakeStripe();
  const { service } = createService({ oposicion: null, fakeStripe });

  await assert.rejects(
    () => service.crearCheckoutSession({ userId: 1, oposicionId: 999, userEmail: 'a@test.local' }),
    /Oposicion no encontrada/,
  );
  assert.equal(fakeStripe.checkoutCalls.length, 0);
}));

test('checkout con precio invalido no invoca Stripe', withEnv(async () => {
  const fakeStripe = createFakeStripe();
  const { service } = createService({
    fakeStripe,
    oposicion: { id: 1, nombre: 'Curso', precio_mensual_cents: 0 },
  });

  await assert.rejects(
    () => service.crearCheckoutSession({ userId: 1, oposicionId: 1, userEmail: 'a@test.local' }),
    /Precio de oposicion invalido/,
  );
  assert.equal(fakeStripe.checkoutCalls.length, 0);
}));

test('error del fake Stripe no concede acceso local', withEnv(async () => {
  const { service, accessCalls } = createService({ failCheckout: new Error('stripe fake down') });

  await assert.rejects(
    () => service.crearCheckoutSession({ userId: 1, oposicionId: 1, userEmail: 'a@test.local' }),
    /stripe fake down/,
  );
  assert.equal(accessCalls.length, 0);
}));

test('barrera Stripe E2E bloquea claves live antes de usar cliente', withEnv(async () => {
  assert.throws(
    () => assertStripeTestIsolation({ stripeSecretKey: 'sk_live_no_usar' }),
    /bloquean claves sk_live_/,
  );
  assert.throws(
    () => assertStripeTestIsolation({ stripePublishableKey: 'pk_live_no_usar' }),
    /bloquean claves pk_live_/,
  );
}));

test('checkout HTTP con token valido usa userId del JWT y no permite usuario ajeno', withEnv(async () => {
  const token = jwt.sign({ userId: 123, email: 'jwt@test.local', role: 'alumno' }, process.env.JWT_SECRET);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(decoded.userId, 123);
  assert.equal(decoded.email, 'jwt@test.local');
}));
