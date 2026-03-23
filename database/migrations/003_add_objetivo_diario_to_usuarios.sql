-- Añade columna objetivo_diario_preguntas a la tabla usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS objetivo_diario_preguntas INT NOT NULL DEFAULT 10;
