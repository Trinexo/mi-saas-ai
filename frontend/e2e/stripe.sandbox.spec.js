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
  await page
    .locator('input[name="cardNumber"], input[autocomplete="cc-number"], input[placeholder*="1234"]')
    .first()
    .fill('4242424242424242');
  await page
    .locator('input[name="cardExpiry"], input[autocomplete="cc-exp"], input[placeholder*="MM"], input[placeholder*="AA"]')
    .first()
    .fill('1234');
  await page
    .locator('input[name="cardCvc"], input[autocomplete="cc-csc"], input[placeholder*="CVC"]')
    .first()
    .fill('123');

  const name = page.locator('input[name="billingName"], input[autocomplete="cc-name"]').first();
  if (await name.count()) {
    await name.fill('E2E Stripe Alumno');
  }

  const email = page.locator('input[type="email"], input[name="email"]').first();
  if (await email.count()) {
    await email.fill(STRIPE_SANDBOX_FIXTURE.email);
  }

  const postalCode = page.locator('input[name="billingPostalCode"], input[autocomplete="postal-code"]').first();
  if (await postalCode.count()) {
    await postalCode.fill('28001');
  }
}

async function waitForPurchasedAccess(page, oposicionName) {
  await expect(async () => {
    await page.goto('/mis-oposiciones?pago=ok');
    await expect(page.locator('body')).toContainText(oposicionName, { timeout: 10_000 });
  }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
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
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/mis-oposiciones\?pago=ok/, { timeout: 60_000 });
  await waitForPurchasedAccess(page, STRIPE_SANDBOX_FIXTURE.successOposicionName);
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
