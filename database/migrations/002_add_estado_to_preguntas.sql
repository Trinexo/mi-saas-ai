-- Migración 002: añadir columna estado a preguntas
-- Estados posibles: 'pendiente' | 'aprobada' | 'rechazada'
-- Por defecto 'aprobada' para no romper las preguntas existentes

ALTER TABLE preguntas
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'aprobada'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada'));

CREATE INDEX IF NOT EXISTS idx_preguntas_estado ON preguntas(estado);
