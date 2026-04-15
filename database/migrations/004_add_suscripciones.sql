-- Migración 004: sistema de suscripciones/planes
-- Aplica plan de acceso por usuario (free, pro, elite)
-- Sin integración de pasarela de pagos (fase 1 / MVP)

CREATE TABLE IF NOT EXISTS suscripciones (
  id                     BIGSERIAL PRIMARY KEY,
  usuario_id             BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  estado                 TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada', 'expirada')),
  fecha_inicio           TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin              TIMESTAMP,                          -- NULL = sin expiración
  stripe_subscription_id TEXT,                              -- para uso futuro con Stripe
  notas                  TEXT,                              -- referencia interna admin
  creada_en              TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizada_en         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario      ON suscripciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_activa        ON suscripciones(usuario_id, estado) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_fin     ON suscripciones(fecha_fin) WHERE fecha_fin IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_suscripciones_stripe ON suscripciones(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
