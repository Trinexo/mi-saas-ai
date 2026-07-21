import { expect } from '@playwright/test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const BLOCKED_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i];

export const STRIPE_SANDBOX_FIXTURE = {
  email: process.env.STRIPE_SANDBOX_ALUMNO_EMAIL || '',
  password: process.env.STRIPE_SANDBOX_PASSWORD || '',
  successOposicionName: process.env.STRIPE_SANDBOX_SUCCESS_OPOSICION_NAME || '',
  cancelOposicionName: process.env.STRIPE_SANDBOX_CANCEL_OPOSICION_NAME || '',
};

function assertLocalUrl(value, label) {
  const url = new URL(value);
  expect(LOCAL_HOSTS.has(url.hostname), `${label} debe ser local`).toBeTruthy();
  expect(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname)), `${label} apunta a host remoto`).toBeFalsy();
  return url;
}

export function assertStripeSandboxIsolation() {
  const frontendUrl = assertLocalUrl(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173', 'PLAYWRIGHT_BASE_URL');
  const apiUrl = assertLocalUrl(process.env.E2E_API_BASE || '', 'E2E_API_BASE');
  const dbUrl = assertLocalUrl(process.env.E2E_DATABASE_URL || '', 'E2E_DATABASE_URL');

  expect(process.env.NODE_ENV, 'Stripe sandbox requiere NODE_ENV=test').toBe('test');
  expect(process.env.ALLOW_STRIPE_E2E, 'Stripe sandbox requiere ALLOW_STRIPE_E2E=true').toBe('true');
  expect(process.env.STRIPE_E2E_MODE, 'Stripe sandbox requiere STRIPE_E2E_MODE=sandbox').toBe('sandbox');
  expect(process.env.E2E_DB_ISOLATED, 'Stripe sandbox requiere E2E_DB_ISOLATED=true').toBe('true');
  expect(process.env.ALLOW_E2E_WRITES, 'Stripe sandbox requiere ALLOW_E2E_WRITES=true').toBe('true');
  expect(process.env.STRIPE_SANDBOX_CONFIRMATION, 'Stripe sandbox requiere confirmacion explicita').toBe('I_CONFIRM_STRIPE_TEST_MODE');
  expect(process.env.STRIPE_SANDBOX_FIXTURES_READY, 'Ejecuta antes backend/tests/e2e/stripe-sandbox-fixtures.mjs setup').toBe('true');

  expect(apiUrl.pathname.startsWith('/api'), 'La API E2E debe estar bajo /api').toBeTruthy();
  expect(/(^|[_-])(test|ci|e2e|sandbox)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')), 'La DB debe tener nombre de test').toBeTruthy();
  expect(frontendUrl.origin).not.toContain('vercel');
  expect(STRIPE_SANDBOX_FIXTURE.email).toMatch(/^e2e_stripe_alumno_[A-Za-z0-9_.+-]+@test\.local$/i);
  expect(STRIPE_SANDBOX_FIXTURE.password).toBeTruthy();
}

export async function loginAsStripeAlumno(page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(STRIPE_SANDBOX_FIXTURE.email);
  await page.locator('input[type="password"]').fill(STRIPE_SANDBOX_FIXTURE.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(/\/catalogo\/?$/);
  await expect(page.locator('body')).toContainText(STRIPE_SANDBOX_FIXTURE.email);
}
