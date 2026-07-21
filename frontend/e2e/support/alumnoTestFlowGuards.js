import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const BLOCKED_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i, /rds/i, /production/i];
const BLOCKED_REQUEST_PATTERNS = [/stripe/i, /checkout\.stripe\.com/i, /smtp/i, /mailgun/i, /sendgrid/i, /postmark/i];

function assertLocalUrl(value, label, { requireApi = false } = {}) {
  const url = new URL(value);
  expect(LOCAL_HOSTS.has(url.hostname), `${label} debe ser local`).toBeTruthy();
  expect(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname)), `${label} apunta a host remoto`).toBeFalsy();
  if (requireApi) {
    expect(url.pathname.startsWith('/api'), `${label} debe estar bajo /api`).toBeTruthy();
  }
  return url;
}

export function loadAlumnoManifest() {
  const manifestPath = process.env.ALUMNO_E2E_MANIFEST || '';
  expect(manifestPath, 'ALUMNO_E2E_MANIFEST requerido').toBeTruthy();
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function assertAlumnoTestFlowIsolation() {
  const frontendUrl = assertLocalUrl(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173', 'PLAYWRIGHT_BASE_URL');
  const apiUrl = assertLocalUrl(process.env.E2E_API_BASE || '', 'E2E_API_BASE', { requireApi: true });
  const dbUrl = assertLocalUrl(process.env.E2E_DATABASE_URL || '', 'E2E_DATABASE_URL');

  expect(process.env.NODE_ENV, 'Alumno test flow requiere NODE_ENV=test').toBe('test');
  expect(process.env.ALLOW_E2E_WRITES, 'Alumno test flow requiere ALLOW_E2E_WRITES=true').toBe('true');
  expect(process.env.E2E_DB_ISOLATED, 'Alumno test flow requiere E2E_DB_ISOLATED=true').toBe('true');
  expect(process.env.ALUMNO_TEST_FLOW_FIXTURES_READY, 'Ejecuta antes alumno-test-flow-fixtures setup').toBe('true');
  expect(process.env.ALUMNO_E2E_PASSWORD, 'ALUMNO_E2E_PASSWORD requerido').toBeTruthy();
  expect(process.env.ALUMNO_E2E_EMAIL, 'ALUMNO_E2E_EMAIL requerido').toMatch(/^e2e_alumno_test_[A-Za-z0-9_.+-]+@test\.local$/i);
  expect(/(^|[_-])(test|ci|e2e)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')), 'La DB debe tener nombre de test').toBeTruthy();
  expect(frontendUrl.origin).not.toContain('vercel');
  expect(apiUrl.origin).not.toContain('railway');

  for (const value of Object.values(process.env)) {
    if (!value || typeof value !== 'string') continue;
    expect(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(value)), 'Entorno E2E contiene host remoto/productivo bloqueado').toBeFalsy();
  }
}

export function installAlumnoNetworkGuards(page, failures) {
  page.on('request', (request) => {
    const url = request.url();
    const parsed = new URL(url);
    if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname)) || BLOCKED_REQUEST_PATTERNS.some((pattern) => pattern.test(url))) {
      failures.push(`Peticion externa bloqueada: ${url}`);
    }
  });

  page.on('response', (response) => {
    const url = response.url();
    const parsed = new URL(url);
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
      if (url.includes('/api/') && response.status() >= 500) {
        failures.push(`API local respondio ${response.status()}: ${url}`);
      }
      return;
    }
    if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
      failures.push(`Respuesta externa bloqueada: ${url}`);
    }
  });
}

export async function loginAsAlumnoTestFlow(page, manifest) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(manifest.alumno.email);
  await page.locator('input[type="password"]').fill(process.env.ALUMNO_E2E_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/catalogo\/?$/);
  await expect(page.locator('body')).toContainText(manifest.alumno.email);
}

export function questionByText(manifest, enunciado) {
  const pregunta = manifest.preguntas.find((item) => item.enunciado === enunciado);
  expect(pregunta, `Pregunta no pertenece a la fixture: ${enunciado}`).toBeTruthy();
  return pregunta;
}

export function chooseAnswerForQuestion(pregunta, shouldBeCorrect) {
  const option = pregunta.opciones.find((item) => Boolean(item.correcta) === shouldBeCorrect);
  expect(option, `No existe opcion ${shouldBeCorrect ? 'correcta' : 'incorrecta'} para ${pregunta.enunciado}`).toBeTruthy();
  return option;
}

export function assertNoAlumnoNetworkFailures(failures) {
  expect(failures, failures.join('\n')).toEqual([]);
}
