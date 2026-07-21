import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertStripeSandboxMetadata,
  assertStripeTestIsolation,
} from '../../src/utils/stripe-test-guards.js';

const BASE_ENV = {
  NODE_ENV: 'test',
  ALLOW_STRIPE_E2E: 'true',
  STRIPE_E2E_MODE: 'sandbox',
  STRIPE_SANDBOX_CONFIRMATION: 'I_CONFIRM_STRIPE_TEST_MODE',
  E2E_DB_ISOLATED: 'true',
  DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/plataforma_test_stripe_sandbox',
  FRONTEND_URL: 'http://127.0.0.1:4173',
  E2E_API_BASE: 'http://127.0.0.1:3000/api',
  VITE_API_URL: 'http://127.0.0.1:3000/api',
  STRIPE_SECRET_KEY: 'sk_test_guard_only',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_guard_only',
};

function withEnv(overrides, callback) {
  return () => {
    const previous = {};
    const next = { ...BASE_ENV, ...overrides };
    for (const key of Object.keys(next)) {
      previous[key] = process.env[key];
      if (next[key] === undefined) delete process.env[key];
      else process.env[key] = next[key];
    }
    try {
      return callback();
    } finally {
      for (const key of Object.keys(next)) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
    }
  };
}

function validMetadata() {
  return {
    userId: '42',
    oposicionId: '7',
    runId: 'stripe_sandbox_123_1',
    testPurpose: 'BL-022',
  };
}

function validEvent() {
  return {
    id: 'evt_test_guard',
    livemode: false,
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_guard', metadata: validMetadata() } },
  };
}

test('Stripe sandbox: acepta entorno local aislado con claves test y metadata identificable', withEnv({}, () => {
  assert.doesNotThrow(() => assertStripeTestIsolation({
    webhookSecret: 'whsec_guard_only',
    event: validEvent(),
    userEmail: 'e2e_stripe_alumno_guard@test.local',
    metadata: validMetadata(),
  }));
}));

test('Stripe sandbox: bloquea claves live sin imprimir valores secretos', withEnv({}, () => {
  assert.throws(
    () => assertStripeTestIsolation({ stripeSecretKey: 'sk_live_no_usar' }),
    /bloquean claves sk_live_/,
  );
  assert.throws(
    () => assertStripeTestIsolation({ stripePublishableKey: 'pk_live_no_usar' }),
    /bloquean claves pk_live_/,
  );
}));

test('Stripe sandbox: bloquea eventos livemode=true', withEnv({}, () => {
  assert.throws(
    () => assertStripeTestIsolation({ event: { ...validEvent(), livemode: true } }),
    /livemode=true/,
  );
}));

test('Stripe sandbox: bloquea URL de frontend o API remota', withEnv({ FRONTEND_URL: 'https://mi-saas-ai.vercel.app' }, () => {
  assert.throws(
    () => assertStripeTestIsolation(),
    /FRONTEND_URL debe apuntar a localhost/,
  );
}));

test('Stripe sandbox: bloquea PostgreSQL remoto o de produccion', withEnv({
  DATABASE_URL: 'postgres://user:pass@ep-test.neon.tech:5432/railway',
}, () => {
  assert.throws(
    () => assertStripeTestIsolation(),
    /PostgreSQL local/,
  );
}));

test('Stripe sandbox: exige email reservado de alumno E2E', withEnv({}, () => {
  assert.throws(
    () => assertStripeTestIsolation({ userEmail: 'alumno@cliente-real.com', metadata: validMetadata() }),
    /email reservado/,
  );
}));

test('Stripe sandbox: exige metadata de run y proposito BL-022', withEnv({}, () => {
  assert.throws(
    () => assertStripeSandboxMetadata({ ...validMetadata(), runId: 'run-real' }),
    /metadata.runId/,
  );
  assert.throws(
    () => assertStripeSandboxMetadata({ ...validMetadata(), testPurpose: 'BL-999' }),
    /metadata.testPurpose=BL-022/,
  );
}));

test('Stripe mock: mantiene exigencia de cliente inyectado cuando se solicita', withEnv({
  STRIPE_E2E_MODE: 'mock',
}, () => {
  assert.throws(
    () => assertStripeTestIsolation({ requireInjectedClient: true }),
    /cliente Stripe inyectado/,
  );
}));
