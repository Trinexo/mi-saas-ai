import Stripe from 'stripe';
import { settingsService } from '../services/settings.service.js';
import { assertStripeTestIsolation } from '../utils/stripe-test-guards.js';

let cachedClient = null;
let cachedKey = null;
let injectedClient = null;

export async function getStripeClient() {
  if (process.env.ALLOW_STRIPE_E2E === 'true' && injectedClient) {
    assertStripeTestIsolation({ injectedClient });
  }
  if (injectedClient) return injectedClient;

  const cfg = await settingsService.getStripeConfig();
  const key = cfg.secretKey;
  if (!key || key.startsWith('sk_test_XXXX')) {
    throw new Error('STRIPE_SECRET_KEY no esta configurada. Anadela en Ajustes del panel admin.');
  }

  if (process.env.ALLOW_STRIPE_E2E === 'true') {
    assertStripeTestIsolation({ stripeSecretKey: key, requireInjectedClient: true, injectedClient });
  }

  if (!cachedClient || cachedKey !== key) {
    cachedClient = new Stripe(key, { apiVersion: '2024-04-10' });
    cachedKey = key;
  }

  return cachedClient;
}

export function setStripeClientForTests(client) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('setStripeClientForTests solo puede usarse con NODE_ENV=test');
  }
  injectedClient = client;
}

export function resetStripeClientForTests() {
  injectedClient = null;
  cachedClient = null;
  cachedKey = null;
}
