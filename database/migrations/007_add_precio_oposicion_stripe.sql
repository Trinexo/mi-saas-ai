-- Migración 007: añadir precio_mensual_cents a oposiciones y stripe_checkout_session_id a accesos_oposicion

-- Precio configurable por oposición (en céntimos de euro)
ALTER TABLE oposiciones
  ADD COLUMN IF NOT EXISTS precio_mensual_cents INT NOT NULL DEFAULT 2900; -- 29€ por defecto

-- Almacenar el Stripe Checkout Session ID para trazabilidad
ALTER TABLE accesos_oposicion
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
