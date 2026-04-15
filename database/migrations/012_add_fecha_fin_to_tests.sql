-- Migración 012: añadir tests.fecha_fin
-- La columna registra cuándo se finalizó (envió) el test.
-- Para tests ya finalizados se rellena con fecha_creacion como aproximación.

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMPTZ;

-- Retroalimentar tests ya finalizados
UPDATE tests SET fecha_fin = fecha_creacion WHERE estado = 'finalizado' AND fecha_fin IS NULL;

CREATE INDEX IF NOT EXISTS idx_tests_fecha_fin ON tests(usuario_id, fecha_fin DESC)
  WHERE fecha_fin IS NOT NULL;
