-- Migración 033: test demo por oposición
-- Añade la columna es_demo a admin_tests y garantiza un único test demo por oposición.

ALTER TABLE admin_tests
  ADD COLUMN IF NOT EXISTS es_demo BOOLEAN NOT NULL DEFAULT FALSE;

-- Índice único parcial: solo puede haber 1 test demo activo por oposición
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_tests_demo_unico
  ON admin_tests (oposicion_id)
  WHERE es_demo = TRUE;
