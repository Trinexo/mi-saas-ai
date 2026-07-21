const REMOTE_HOST_PATTERNS = [
  'railway',
  'rlwy',
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
  for (const pattern of REMOTE_HOST_PATTERNS) {
    if (value.toLowerCase().includes(pattern)) {
      throw new Error('DATABASE_URL no puede apuntar a servicios remotos en pruebas Stripe');
    }
  }
  const dbName = parsed.pathname.replace('/', '').toLowerCase();
  if (!dbName.includes('test') && !dbName.includes('e2e')) {
    throw new Error('DATABASE_URL debe usar una base con nombre de test/e2e');
  }
}

function assertBaseIsolation() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Las pruebas Stripe aisladas exigen NODE_ENV=test');
  }
  if (process.env.E2E_DB_ISOLATED !== 'true') {
    throw new Error('Las pruebas Stripe aisladas exigen E2E_DB_ISOLATED=true');
  }

  assertTestPostgresUrl(process.env.DATABASE_URL);
  assertLocalUrl(process.env.FRONTEND_URL, 'FRONTEND_URL');
  assertLocalUrl(process.env.E2E_API_BASE, 'E2E_API_BASE');
  assertLocalUrl(process.env.VITE_API_URL, 'VITE_API_URL');
}

function assertNoLiveStripeValues({ stripeSecretKey, stripePublishableKey, event }) {
  if (stripeSecretKey?.startsWith('sk_live_')) {
    throw new Error('Las pruebas Stripe aisladas bloquean claves sk_live_');
  }
  if (stripePublishableKey?.startsWith('pk_live_')) {
    throw new Error('Las pruebas Stripe aisladas bloquean claves pk_live_');
  }
  if (event?.livemode === true) {
    throw new Error('Las pruebas Stripe aisladas bloquean eventos livemode=true');
  }
}

function assertPositiveMetadataId(metadata, key) {
  if (metadata?.[key] === undefined) return;
  const value = Number(metadata[key]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Stripe sandbox exige metadata.${key} entero positivo`);
  }
}

export function assertStripeSandboxMetadata(metadata = {}) {
  if (process.env.ALLOW_STRIPE_E2E !== 'true' || process.env.STRIPE_E2E_MODE !== 'sandbox') return;

  assertPositiveMetadataId(metadata, 'userId');
  assertPositiveMetadataId(metadata, 'oposicionId');
  if (metadata.runId !== undefined && !/^stripe_sandbox_[A-Za-z0-9_-]+$/.test(String(metadata.runId))) {
    throw new Error('Stripe sandbox exige metadata.runId identificable');
  }
  if (metadata.testPurpose !== undefined && metadata.testPurpose !== 'BL-022') {
    throw new Error('Stripe sandbox exige metadata.testPurpose=BL-022');
  }
}

function assertStripeSandboxEmail(userEmail) {
  if (!userEmail) return;
  if (!/^e2e_stripe_alumno_[A-Za-z0-9_.+-]+@test\.local$/i.test(String(userEmail))) {
    throw new Error('Stripe sandbox exige email reservado e2e_stripe_alumno_*@test.local');
  }
}

function assertSandboxMode({
  stripeSecretKey,
  webhookSecret,
  event,
  userEmail,
  metadata,
}) {
  if (!stripeSecretKey?.startsWith('sk_test_')) {
    throw new Error('Stripe sandbox exige clave secreta sk_test_');
  }
  if (webhookSecret !== undefined && !webhookSecret?.startsWith('whsec_')) {
    throw new Error('Stripe sandbox exige webhook secret whsec_');
  }
  if (process.env.GITHUB_EVENT_NAME && process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch') {
    throw new Error('Stripe sandbox solo puede ejecutarse mediante workflow_dispatch');
  }
  if (
    process.env.STRIPE_SANDBOX_CONFIRMATION !== undefined
    && process.env.STRIPE_SANDBOX_CONFIRMATION !== 'I_CONFIRM_STRIPE_TEST_MODE'
  ) {
    throw new Error('Stripe sandbox exige confirmacion explicita de modo test');
  }

  assertStripeSandboxEmail(userEmail);
  assertStripeSandboxMetadata(metadata);

  const eventSession = event?.data?.object;
  if (eventSession?.metadata) {
    assertStripeSandboxMetadata(eventSession.metadata);
  }
}

function assertMockMode({ requireInjectedClient, injectedClient }) {
  if (requireInjectedClient && !injectedClient) {
    throw new Error('Las pruebas Stripe mock exigen cliente Stripe inyectado');
  }
}

export function assertStripeTestIsolation({
  stripeSecretKey = process.env.STRIPE_SECRET_KEY,
  stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret = undefined,
  event = null,
  requireInjectedClient = false,
  injectedClient = null,
  userEmail = null,
  metadata = null,
} = {}) {
  if (process.env.ALLOW_STRIPE_E2E !== 'true') return;

  assertBaseIsolation();
  assertNoLiveStripeValues({ stripeSecretKey, stripePublishableKey, event });

  if (process.env.STRIPE_E2E_MODE === 'mock') {
    assertMockMode({ requireInjectedClient, injectedClient });
    return;
  }

  if (process.env.STRIPE_E2E_MODE === 'sandbox') {
    assertSandboxMode({ stripeSecretKey, webhookSecret, event, userEmail, metadata });
    return;
  }

  throw new Error('Las pruebas Stripe aisladas exigen STRIPE_E2E_MODE=mock o sandbox');
}

export function isAllowedLocalNetworkHost(host) {
  const normalized = String(host ?? '').toLowerCase();
  return LOCAL_HOSTS.has(normalized);
}
