import { z } from 'zod';

const booleanLikeSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  },
  z.boolean().optional()
);

export const updateEmailSettingsSchema = z.object({
  smtp_host:   z.string().max(253).optional(),
  smtp_port:   z.union([z.string(), z.number()]).optional(),
  smtp_secure: booleanLikeSchema,
  smtp_user:   z.string().max(255).optional(),
  smtp_pass:   z.string().max(255).optional(),
  email_from:  z.string().max(255).optional(),
  app_name:    z.string().max(100).optional(),
}).strict();

export const updateStripeSettingsSchema = z.object({
  stripe_secret_key:     z.string().regex(/^sk_(test|live)_/).optional(),
  stripe_webhook_secret: z.string().regex(/^whsec_/).optional(),
}).strict();
