import { expect } from '@playwright/test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const BLOCKED_HOST_PATTERNS = [/railway/i, /rlwy/i, /vercel/i, /supabase/i, /neon/i, /render/i, /amazonaws/i];

export const ROLE_FIXTURE = {
  admin: {
    email: process.env.ROLE_E2E_ADMIN_EMAIL || 'e2e_role_admin@test.local',
    password: process.env.ROLE_E2E_PASSWORD || 'role-e2e-2026',
    home: /\/admin\/?$/,
  },
  profesor: {
    email: process.env.ROLE_E2E_PROFESOR_EMAIL || 'e2e_role_profesor@test.local',
    password: process.env.ROLE_E2E_PASSWORD || 'role-e2e-2026',
    home: /\/profesor\/?$/,
  },
  alumno: {
    email: process.env.ROLE_E2E_ALUMNO_EMAIL || 'e2e_role_alumno@test.local',
    password: process.env.ROLE_E2E_PASSWORD || 'role-e2e-2026',
    home: /\/catalogo\/?$/,
  },
};

export function assertRoleE2EIsolation() {
  const frontendUrl = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173');
  const apiUrl = new URL(process.env.E2E_API_BASE || '');
  const dbUrl = new URL(process.env.E2E_DATABASE_URL || '');

  expect(process.env.NODE_ENV, 'Role E2E requiere NODE_ENV=test').toBe('test');
  expect(process.env.E2E_DB_ISOLATED, 'Role E2E requiere E2E_DB_ISOLATED=true').toBe('true');
  expect(process.env.ALLOW_E2E_WRITES, 'Role E2E requiere ALLOW_E2E_WRITES=true').toBe('true');
  expect(process.env.E2E_ROLE_FIXTURES_READY, 'Ejecuta antes backend/tests/e2e/role-fixtures.mjs setup').toBe('true');

  expect(LOCAL_HOSTS.has(frontendUrl.hostname), `Frontend E2E no local: ${frontendUrl.hostname}`).toBeTruthy();
  expect(LOCAL_HOSTS.has(apiUrl.hostname), `API E2E no local: ${apiUrl.hostname}`).toBeTruthy();
  expect(apiUrl.pathname.startsWith('/api'), 'La API E2E debe estar bajo /api').toBeTruthy();
  expect(LOCAL_HOSTS.has(dbUrl.hostname), `DB E2E no local: ${dbUrl.hostname}`).toBeTruthy();
  expect(/(^|[_-])(test|ci|e2e)($|[_-])|plataforma_test/i.test(dbUrl.pathname.replace(/^\//, '')), 'La DB debe tener nombre de test').toBeTruthy();

  for (const url of [frontendUrl, apiUrl, dbUrl]) {
    expect(BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname)), `Host remoto bloqueado: ${url.hostname}`).toBeFalsy();
  }
}

export async function loginAs(page, role) {
  const user = ROLE_FIXTURE[role];
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page).toHaveURL(user.home);
  await expect(page.locator('body')).toContainText(user.email);
}

export async function readToken(page) {
  return page.evaluate(() => window.localStorage.getItem('token'));
}

export async function logout(page) {
  await page.getByRole('button', { name: /cerrar sesi/i }).click();
  await expect(page).toHaveURL(/\/login\/?$/);
}

