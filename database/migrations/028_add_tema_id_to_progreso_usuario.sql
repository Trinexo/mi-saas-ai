-- Migracion 028: progreso por tema como modelo oficial.
-- Mantiene bloque_id como compatibilidad legacy.

ALTER TABLE progreso_usuario
  ADD COLUMN IF NOT EXISTS tema_id BIGINT REFERENCES temas(id) ON DELETE CASCADE;

UPDATE progreso_usuario pu
SET tema_id = b.tema_id
FROM bloques b
WHERE pu.tema_id IS NULL
  AND pu.bloque_id = b.id;

ALTER TABLE progreso_usuario
  ALTER COLUMN bloque_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_progreso_usuario_tema_unique
  ON progreso_usuario(usuario_id, tema_id)
  WHERE tema_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_progreso_usuario_tema
  ON progreso_usuario(usuario_id, tema_id);
