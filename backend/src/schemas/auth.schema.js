import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  oposicionPreferidaId: z.coerce.number().int().positive().nullable().optional(),
  objetivoDiarioPreguntas: z.coerce.number().int().min(1).max(200).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Se requiere al menos un campo' });

export const updatePasswordSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNuevo: z.string().min(8),
});

export const patchOposicionPreferidaSchema = z.object({
  oposicionPreferidaId: z.coerce.number().int().positive().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  passwordNuevo: z.string().min(8),
});