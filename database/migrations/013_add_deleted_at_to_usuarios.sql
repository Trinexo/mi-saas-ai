-- Migration 013: soft-delete en usuarios
-- Añade deleted_at para borrado lógico; evita problemas de FK en cascada.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_not_deleted
  ON usuarios (id)
  WHERE deleted_at IS NULL;
