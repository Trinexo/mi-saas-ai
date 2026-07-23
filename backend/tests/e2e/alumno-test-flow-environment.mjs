import assert from 'node:assert/strict';

const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const BLOCKED_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i, /rds/i, /production/i];
const APPLICATION_ENV_NAME_PATTERN = /(?:DATABASE|POSTGRES|PGHOST|MYSQL|MONGO|REDIS|URL|ORIGIN|API|HOST)/i;

function isApplicationEnvironmentName(name) {
  return name !== 'CI'
    && !/^GITHUB_/i.test(name)
    && !/^RUNNER_/i.test(name)
    && APPLICATION_ENV_NAME_PATTERN.test(name);
}

export function assertLocalUrl(value, label, { requireApi = false } = {}) {
  assert.ok(value, `${label} requerido`);
  const parsed = new URL(value);
  assert.ok(LOCAL_DB_HOSTS.has(parsed.hostname), `${label} debe apuntar a host local: ${parsed.hostname}`);
  assert.equal(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname)), false, `${label} apunta a host remoto o productivo`);
  if (requireApi) {
    assert.ok(parsed.pathname.startsWith('/api'), `${label} debe estar bajo /api`);
  }
  return parsed;
}

function assertLocalHost(value, label) {
  const host = value.trim().replace(/^\[|\]$/g, '');
  assert.ok(LOCAL_DB_HOSTS.has(host), `${label} debe apuntar a host local: ${host}`);
  assert.equal(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(host)), false, `${label} apunta a host remoto o productivo`);
}

function assertApplicationEnvironmentValue(name, value) {
  if (/^PGHOST$/i.test(name) || (/HOST$/i.test(name) && !value.includes('://'))) {
    assertLocalHost(value, name);
    return;
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
    assertLocalUrl(value, name, { requireApi: /API/i.test(name) });
  }
}

export function assertSafeEnvironment(environment = process.env) {
  const databaseUrl = environment.DATABASE_URL;
  const e2eDatabaseUrl = environment.E2E_DATABASE_URL || databaseUrl;
  const alumnoRunId = environment.ALUMNO_E2E_RUN_ID || 'alumno_test_flow_local';
  const alumnoEmail = environment.ALUMNO_E2E_EMAIL || `e2e_alumno_test_${alumnoRunId}@test.local`;

  assert.equal(environment.NODE_ENV, 'test', 'Alumno test flow requiere NODE_ENV=test');
  assert.equal(environment.ALLOW_E2E_WRITES, 'true', 'Alumno test flow requiere ALLOW_E2E_WRITES=true');
  assert.equal(environment.E2E_DB_ISOLATED, 'true', 'Alumno test flow requiere E2E_DB_ISOLATED=true');
  assert.ok(e2eDatabaseUrl, 'Alumno test flow requiere E2E_DATABASE_URL');
  assert.ok(databaseUrl, 'Alumno test flow requiere DATABASE_URL');

  const a = new URL(e2eDatabaseUrl);
  const b = new URL(databaseUrl);
  assert.deepEqual(
    [a.protocol, a.hostname, a.port, a.pathname],
    [b.protocol, b.hostname, b.port, b.pathname],
    'DATABASE_URL y E2E_DATABASE_URL deben apuntar a la misma base aislada',
  );

  const dbUrl = assertLocalUrl(e2eDatabaseUrl, 'E2E_DATABASE_URL');
  assert.ok(
    /(^|[_-])(test|ci|e2e)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')),
    'Alumno test flow requiere nombre de base claramente de test',
  );

  if (environment.E2E_API_BASE) assertLocalUrl(environment.E2E_API_BASE, 'E2E_API_BASE', { requireApi: true });
  if (environment.PLAYWRIGHT_BASE_URL) assertLocalUrl(environment.PLAYWRIGHT_BASE_URL, 'PLAYWRIGHT_BASE_URL');
  if (environment.FRONTEND_URL) assertLocalUrl(environment.FRONTEND_URL, 'FRONTEND_URL');
  assert.match(alumnoEmail, /^e2e_alumno_test_[A-Za-z0-9_.+-]+@test\.local$/i);

  for (const [name, value] of Object.entries(environment)) {
    if (!value || typeof value !== 'string' || !isApplicationEnvironmentName(name)) continue;
    assertApplicationEnvironmentValue(name, value);
  }
}
