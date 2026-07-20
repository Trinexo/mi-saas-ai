import { expect, test } from '@playwright/test';
import { assertRoleE2EIsolation, loginAs, logout, readToken } from './support/roleE2eGuards.js';

const API_BASE = process.env.E2E_API_BASE || 'http://127.0.0.1:3000/api';
const OPOSICION_NAME = process.env.ROLE_E2E_OPOSICION_NAME || 'E2E Role Oposicion BL-021';

async function apiGet(request, path, token) {
  return request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  assertRoleE2EIsolation();
  const response = await request.get(`${API_BASE}/oposiciones`);
  expect(response.status(), 'La API local aislada debe responder catalogo').toBe(200);
  const body = await response.json();
  expect(body.data.some((oposicion) => oposicion.nombre === OPOSICION_NAME)).toBeTruthy();
});

test('admin: login real, navegacion admin y bloqueos cruzados', async ({ page, request }) => {
  await loginAs(page, 'admin');
  await expect(page.getByRole('link', { name: /usuarios/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /profesores/i }).first()).toBeVisible();

  const token = await readToken(page);
  expect(token).toBeTruthy();
  expect((await apiGet(request, '/admin/users', token)).status()).toBe(200);
  expect((await apiGet(request, '/subscriptions/stats', token)).status()).toBe(200);
  expect((await apiGet(request, '/profesor/dashboard', token)).status()).toBe(403);

  await page.goto('/profesor');
  await expect(page).toHaveURL(/\/admin\/?$/);
  await page.goto('/catalogo');
  await expect(page).toHaveURL(/\/admin\/?$/);
  await logout(page);
});

test('profesor: login real, workspace profesor y bloqueo de admin', async ({ page, request }) => {
  await loginAs(page, 'profesor');
  await expect(page.getByRole('link', { name: /mis oposiciones/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /^alumnos$/i }).first()).toBeVisible();

  const token = await readToken(page);
  expect(token).toBeTruthy();
  expect((await apiGet(request, '/profesor/dashboard', token)).status()).toBe(200);
  expect((await apiGet(request, '/admin/preguntas?page=1&page_size=5', token)).status()).toBe(200);
  expect((await apiGet(request, '/admin/users', token)).status()).toBe(403);
  expect((await apiGet(request, '/subscriptions/stats', token)).status()).toBe(403);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/profesor\/?$/);
  await page.goto('/catalogo');
  await expect(page).toHaveURL(/\/profesor\/?$/);
  await logout(page);
});

test('alumno: login real, area alumno y bloqueo de staff', async ({ page, request }) => {
  await loginAs(page, 'alumno');
  await expect(page.getByRole('link', { name: /cat.logo|catalogo/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /crear test/i }).first()).toBeVisible();

  const token = await readToken(page);
  expect(token).toBeTruthy();
  expect((await apiGet(request, '/stats/user', token)).status()).toBe(200);
  expect((await apiGet(request, '/admin/users', token)).status()).toBe(403);
  expect((await apiGet(request, '/profesor/dashboard', token)).status()).toBe(403);
  expect((await apiGet(request, '/subscriptions/stats', token)).status()).toBe(403);

  await page.goto('/admin');
  await expect(page).toHaveURL(/\/?$/);
  await page.goto('/profesor');
  await expect(page).toHaveURL(/\/?$/);
  await logout(page);
});
