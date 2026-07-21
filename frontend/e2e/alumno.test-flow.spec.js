import { expect, test } from '@playwright/test';
import {
  assertAlumnoTestFlowIsolation,
  assertNoAlumnoNetworkFailures,
  chooseAnswerForQuestion,
  installAlumnoNetworkGuards,
  loadAlumnoManifest,
  loginAsAlumnoTestFlow,
  questionByText,
} from './support/alumnoTestFlowGuards.js';

const API_BASE = process.env.E2E_API_BASE || 'http://127.0.0.1:3000/api';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  assertAlumnoTestFlowIsolation();
  const manifest = loadAlumnoManifest();
  const response = await request.get(`${API_BASE}/oposiciones`);
  expect(response.status(), 'La API local aislada debe responder catalogo').toBe(200);
  const payload = await response.json();
  expect(payload.data.some((oposicion) => oposicion.nombre === manifest.oposicion.nombre)).toBeTruthy();
});

test('alumno: crea, resuelve, revisa y consulta historial/progreso de un test real', async ({ page }) => {
  const manifest = loadAlumnoManifest();
  const networkFailures = [];
  installAlumnoNetworkGuards(page, networkFailures);

  await loginAsAlumnoTestFlow(page, manifest);

  await page.getByRole('link', { name: /crear test/i }).first().click();
  await expect(page).toHaveURL(/\/configurar-test\/?$/);
  await expect(page.locator('body')).toContainText(manifest.oposicion.nombre);
  await expect(page.locator('body')).toContainText(manifest.tema.nombre);

  await page.getByLabel(manifest.tema.nombre).check();
  await page.locator('input[type="number"]').first().fill('5');
  await page.locator('input[name="modo"][value="normal"]').check({ force: true });

  const [generateResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/tests/generate') && response.request().method() === 'POST'),
    page.getByRole('button', { name: /crear test/i }).last().click(),
  ]);
  expect(generateResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/test\/?$/);

  const activeTest = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('active_test')));
  expect(activeTest.testId, 'El navegador debe crear el test real').toBeTruthy();
  expect(activeTest.temaId).toBe(manifest.tema.id);
  expect(activeTest.oposicionId).toBe(manifest.oposicion.id);
  expect(activeTest.modo).toBe('normal');
  expect(activeTest.preguntas).toHaveLength(5);

  for (let index = 0; index < activeTest.preguntas.length; index += 1) {
    const pregunta = questionByText(manifest, activeTest.preguntas[index].enunciado);
    await expect(page.locator('body')).toContainText(pregunta.enunciado);
    const option = chooseAnswerForQuestion(pregunta, index < 3);
    await page.getByRole('button', { name: option.texto }).click();
    if (index < activeTest.preguntas.length - 1) {
      await page.getByRole('button', { name: /siguiente/i }).click();
    }
  }

  const [submitResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/tests/submit') && response.request().method() === 'POST'),
    page.getByRole('button', { name: /enviar/i }).click(),
  ]);
  expect(submitResponse.status()).toBe(200);
  await expect(page).toHaveURL(/\/resultado\/?$/);
  await expect(page.locator('body')).toContainText('Aciertos');
  await expect(page.locator('body')).toContainText('Errores');
  await expect(page.locator('body')).toContainText('Total');

  await page.getByRole('link', { name: /revisar respuestas/i }).click();
  await expect(page).toHaveURL(new RegExp(`/revision/${activeTest.testId}/?$`));
  for (const generatedQuestion of activeTest.preguntas) {
    const pregunta = questionByText(manifest, generatedQuestion.enunciado);
    await expect(page.locator('body')).toContainText(pregunta.enunciado);
    await expect(page.locator('body')).toContainText(pregunta.explicacion);
  }
  await expect(page.locator('body')).toContainText('(tu respuesta)');

  await page.getByRole('link', { name: /historial/i }).first().click();
  await expect(page).toHaveURL(/\/historial\/?$/);
  await expect(page.locator('body')).toContainText(manifest.oposicion.nombre);
  await expect(page.locator('body')).toContainText(manifest.tema.nombre);
  await expect(page.locator('body')).toContainText('3A');
  await expect(page.locator('body')).toContainText('2E');
  await expect(page.getByRole('link', { name: /^Revisar$/i }).first()).toBeVisible();

  await page.getByRole('link', { name: /estadisticas/i }).first().click();
  await expect(page).toHaveURL(/\/progreso\/?$/);
  await expect(page.locator('body')).toContainText(manifest.oposicion.nombre);
  await expect(page.locator('body')).toContainText('Mi progreso');

  await page.getByRole('button', { name: /cerrar sesi/i }).click();
  await expect(page).toHaveURL(/\/login\/?$/);
  await page.goto('/historial');
  await expect(page).toHaveURL(/\/login\/?$/);

  assertNoAlumnoNetworkFailures(networkFailures);
});
