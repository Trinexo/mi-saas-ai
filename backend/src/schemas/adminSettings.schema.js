import { z } from 'zod';

export const updateEmailSettingsSchema = z.object({
  smtp_host:   z.string().max(253).optional(),
  smtp_port:   z.union([z.string(), z.number()]).optional(),
  smtp_secure: z.enum(['true', 'false', true, false]).optional(),
  smtp_user:   z.string().max(255).optional(),
  smtp_pass:   z.string().max(255).optional(),
  email_from:  z.string().max(255).optional(),
  app_name:    z.string().max(100).optional(),
}).strict();

export const updateStripeSettingsSchema = z.object({
  stripe_secret_key:     z.string().regex(/^sk_(test|live)_/).optional(),
  stripe_webhook_secret: z.string().regex(/^whsec_/).optional(),
}).strict();
