import { expect, test } from '@playwright/test';
import {
  STRIPE_SANDBOX_FIXTURE,
  assertStripeSandboxIsolation,
  loginAsStripeAlumno,
} from './support/stripeSandboxGuards.js';

const RUN_SUCCESS = process.env.RUN_CHECKOUT_SUCCESS !== 'false';
const RUN_CANCEL = process.env.RUN_CHECKOUT_CANCEL !== 'false';

async function startCheckout(page, oposicionName) {
  await page.goto('/catalogo');
  await expect(page.locator('body')).toContainText(oposicionName);
  const name = page.getByText(oposicionName, { exact: true }).first();
  const card = name.locator('xpath=ancestor::div[.//button[contains(normalize-space(.), "Comprar acceso completo")]][1]');
  await card.getByRole('button', { name: /comprar acceso completo/i }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
}

async function fillStripeCheckout(page) {
  await page.getByLabel(/card number|numero de tarjeta|número de tarjeta/i).fill('4242424242424242');
  await page.getByLabel(/expiration|caducidad|fecha de vencimiento/i).fill('1234');
  await page.getByLabel(/cvc|codigo de seguridad|código de seguridad/i).fill('123');

  const name = page.getByLabel(/name on card|nombre en la tarjeta|nombre completo/i);
  if (await name.count()) {
    await name.first().fill('E2E Stripe Alumno');
  }

  const email = page.getByLabel(/^email$/i);
  if (await email.count()) {
    await email.first().fill(STRIPE_SANDBOX_FIXTURE.email);
  }
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  assertStripeSandboxIsolation();
});

test('Stripe sandbox: checkout success concede acceso tras webhook real de test', async ({ page }) => {
  test.skip(!RUN_SUCCESS, 'run_checkout_success=false');

  await loginAsStripeAlumno(page);
  await startCheckout(page, STRIPE_SANDBOX_FIXTURE.successOposicionName);
  await fillStripeCheckout(page);
  await page.getByRole('button', { name: /pay|pagar/i }).click();
  await page.waitForURL(/\/mis-oposiciones\?pago=ok/, { timeout: 60_000 });
  await expect(page.locator('body')).toContainText(STRIPE_SANDBOX_FIXTURE.successOposicionName);
});

test('Stripe sandbox: checkout cancelado no concede acceso', async ({ page }) => {
  test.skip(!RUN_CANCEL, 'run_checkout_cancel=false');

  await loginAsStripeAlumno(page);
  await startCheckout(page, STRIPE_SANDBOX_FIXTURE.cancelOposicionName);
  const returnLink = page.getByRole('link', { name: /volver|return|back|cancel/i }).first();
  await expect(returnLink).toBeVisible({ timeout: 30_000 });
  await returnLink.click();
  await page.waitForURL(/\/catalogo\?pago=cancelado/, { timeout: 60_000 });
  await expect(page.locator('body')).toContainText(STRIPE_SANDBOX_FIXTURE.cancelOposicionName);
});
