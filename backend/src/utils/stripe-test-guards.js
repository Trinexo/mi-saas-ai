const REMOTE_HOST_PATTERNS = [
  'railway',
  'vercel',
  'render',
  'supabase',
  'neon',
  'amazonaws',
  'rds.amazonaws',
  'api.stripe.com',
];

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function parseUrl(value, label) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    throw new Error(`${label} debe ser una URL valida en pruebas Stripe`);
  }
}

function assertLocalUrl(value, label) {
  const parsed = parseUrl(value, label);
  if (!parsed) return;

  const host = parsed.hostname.toLowerCase();
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`${label} debe apuntar a localhost en pruebas Stripe`);
  }
  for (const pattern of REMOTE_HOST_PATTERNS) {
    if (value.toLowerCase().includes(pattern)) {
      throw new Error(`${label} no puede apuntar a servicios remotos en pruebas Stripe`);
    }
  }
}

function assertTestPostgresUrl(value) {
  if (!value) throw new Error('DATABASE_URL es obligatoria en pruebas Stripe');
  const parsed = parseUrl(value, 'DATABASE_URL');
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('DATABASE_URL debe ser PostgreSQL en pruebas Stripe');
  }
  const host = parsed.hostname.toLowerCase();
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error('DATABASE_URL debe apuntar a PostgreSQL local en pruebas Stripe');
  }
  const dbName = parsed.pathname.replace('/', '').toLowerCase();
  if (!dbName.includes('test') && !dbName.includes('e2e')) {
    throw new Error('DATABASE_URL debe usar una base con nombre de test/e2e');
  }
}

export function assertStripeTestIsolation({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY,
  event = null,
  requireInjectedClient = false,
  injectedClient = null,
} = {}) {
  if (process.env.ALLOW_STRIPE_E2E !== 'true') return;

  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Las pruebas Stripe aisladas exigen NODE_ENV=test');
  }
  if (process.env.STRIPE_E2E_MODE !== 'mock') {
    throw new Error('Las pruebas Stripe aisladas exigen STRIPE_E2E_MODE=mock');
  }
  if (process.env.E2E_DB_ISOLATED !== 'true') {
    throw new Error('Las pruebas Stripe aisladas exigen E2E_DB_ISOLATED=true');
  }

  assertTestPostgresUrl(process.env.DATABASE_URL);
  assertLocalUrl(process.env.FRONTEND_URL, 'FRONTEND_URL');
  assertLocalUrl(process.env.E2E_API_BASE, 'E2E_API_BASE');
  assertLocalUrl(process.env.VITE_API_URL, 'VITE_API_URL');

  if (stripeSecretKey?.startsWith('sk_live_')) {
    throw new Error('Las pruebas Stripe aisladas bloquean claves sk_live_');
  }
  if (stripePublishableKey?.startsWith('pk_live_')) {
    throw new Error('Las pruebas Stripe aisladas bloquean claves pk_live_');
  }
  if (event?.livemode === true) {
    throw new Error('Las pruebas Stripe aisladas bloquean eventos livemode=true');
  }
  if (requireInjectedClient && !injectedClient) {
    throw new Error('Las pruebas Stripe aisladas exigen cliente Stripe inyectado');
  }
}

export function isAllowedLocalNetworkHost(host) {
  const normalized = String(host ?? '').toLowerCase();
  return LOCAL_HOSTS.has(normalized);
}
