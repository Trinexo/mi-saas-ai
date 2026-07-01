import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updateEmailSettingsSchema,
  updateStripeSettingsSchema,
} from '../../src/schemas/adminSettings.schema.js';

test('updateEmailSettingsSchema normaliza smtp_secure', () => {
  assert.deepEqual(updateEmailSettingsSchema.parse({ smtp_secure: 'true' }), { smtp_secure: true });
  assert.deepEqual(updateEmailSettingsSchema.parse({ smtp_secure: '1' }), { smtp_secure: true });
  assert.deepEqual(updateEmailSettingsSchema.parse({ smtp_secure: 'false' }), { smtp_secure: false });
  assert.deepEqual(updateEmailSettingsSchema.parse({ smtp_secure: false }), { smtp_secure: false });
});

test('updateEmailSettingsSchema rechaza campos y booleanos invalidos', () => {
  assert.equal(updateEmailSettingsSchema.safeParse({ smtp_secure: 'si' }).success, false);
  assert.equal(updateEmailSettingsSchema.safeParse({ campo_extra: 'x' }).success, false);
});

test('updateStripeSettingsSchema valida claves conocidas', () => {
  assert.equal(updateStripeSettingsSchema.safeParse({ stripe_secret_key: 'sk_test_123' }).success, true);
  assert.equal(updateStripeSettingsSchema.safeParse({ stripe_webhook_secret: 'whsec_123' }).success, true);
  assert.equal(updateStripeSettingsSchema.safeParse({ stripe_secret_key: 'pk_test_123' }).success, false);
});
