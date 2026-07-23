import assert from 'node:assert/strict';
import test from 'node:test';
import { assertApplicationEnvironment } from '../e2e/support/alumnoTestFlowGuards.js';

const localEnvironment = (overrides = {}) => ({
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/plataforma_test_alumno_flow_e2e',
  E2E_DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/plataforma_test_alumno_flow_e2e',
  POSTGRES_URL: 'postgres://postgres:postgres@localhost:5432/plataforma_test_alumno_flow_e2e',
  PGHOST: 'localhost',
  PGPORT: '5432',
  PGDATABASE: 'plataforma_test_alumno_flow_e2e',
  PGUSER: 'postgres',
  E2E_API_BASE: 'http://127.0.0.1:3000/api',
  PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:4173',
  FRONTEND_URL: 'http://localhost:4173',
  VITE_API_URL: 'http://127.0.0.1:3000/api',
  ...overrides,
});

test('ignora metadatos CI y URLs de GitHub', () => {
  assert.doesNotThrow(() => assertApplicationEnvironment(localEnvironment({
    GITHUB_HEAD_REF: 'chore/railway-migrations-runner',
    GITHUB_REF: 'refs/heads/chore/railway-migrations-runner',
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_WORKFLOW_REF: 'Trinexo/mi-saas-ai/.github/workflows/backend-ci.yml@refs/pull/428/merge',
    RUNNER_TEMP: 'https://runner.example.test/temp',
    npm_config_registry: 'https://registry.npmjs.org',
  })));
});

test('rechaza DATABASE_URL remota', () => {
  assert.throws(
    () => assertApplicationEnvironment(localEnvironment({ DATABASE_URL: 'postgres://user:password@production.example.test:5432/app' })),
    /debe ser local|host remoto/,
  );
});

test('rechaza E2E_API_BASE remoto', () => {
  assert.throws(
    () => assertApplicationEnvironment(localEnvironment({ E2E_API_BASE: 'https://api.railway.app/api' })),
    /debe ser local|host remoto/,
  );
});

test('rechaza PLAYWRIGHT_BASE_URL remoto', () => {
  assert.throws(
    () => assertApplicationEnvironment(localEnvironment({ PLAYWRIGHT_BASE_URL: 'https://preview.vercel.app' })),
    /debe ser local|host remoto/,
  );
});

test('permite hosts locales del workflow', () => {
  assert.doesNotThrow(() => assertApplicationEnvironment(localEnvironment({
    PGHOST: '127.0.0.1',
    DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/plataforma_test_alumno_flow_e2e',
    E2E_DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:5432/plataforma_test_alumno_flow_e2e',
  })));
});
