-- Sprint 8: añade columna oposicion_preferida_id a usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS oposicion_preferida_id BIGINT REFERENCES oposiciones(id) ON DELETE SET NULL;
