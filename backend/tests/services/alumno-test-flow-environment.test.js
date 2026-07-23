import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeEnvironment } from '../e2e/alumno-test-flow-environment.mjs';

function localEnvironment(overrides = {}) {
  return {
    NODE_ENV: 'test',
    ALLOW_E2E_WRITES: 'true',
    E2E_DB_ISOLATED: 'true',
    DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/plataforma_test_alumno_flow_e2e',
    E2E_DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/plataforma_test_alumno_flow_e2e',
    E2E_API_BASE: 'http://127.0.0.1:3000/api',
    FRONTEND_URL: 'http://127.0.0.1:4173',
    PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:4173',
    ALUMNO_E2E_EMAIL: 'e2e_alumno_test_run@test.local',
    ...overrides,
  };
}

test('ignora referencias de rama y metadatos internos de GitHub Actions', () => {
  assert.doesNotThrow(() => assertSafeEnvironment(localEnvironment({
    GITHUB_HEAD_REF: 'chore/railway-migrations-runner',
    GITHUB_REF: 'refs/heads/chore/railway-migrations-runner',
    GITHUB_REPOSITORY: 'Trinexo/mi-saas-ai',
    CI: 'true',
    RUNNER_NAME: 'GitHub Actions Runner',
  })));
});

test('rechaza una DATABASE_URL productiva', () => {
  assert.throws(
    () => assertSafeEnvironment(localEnvironment({
      DATABASE_URL: 'postgres://user:password@production.example.test:5432/app',
      E2E_DATABASE_URL: 'postgres://user:password@production.example.test:5432/app',
    })),
    /debe apuntar a host local|remoto o productivo/,
  );
});

test('rechaza una URL remota en una variable de aplicación', () => {
  assert.throws(
    () => assertSafeEnvironment(localEnvironment({
      PAYMENTS_API_URL: 'https://api.example.test/payments',
    })),
    /debe apuntar a host local|remoto o productivo/,
  );
});
