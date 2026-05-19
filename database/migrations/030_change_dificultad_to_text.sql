-- ─── Migración 030: Cambio de dificultad a 3 niveles (facil / media / dificil) ─
-- Motivo: simplificar el modelo de dificultad de 5 niveles numéricos a 3 niveles
--         textuales coherentes con la UI: fácil, media, difícil.
-- Tablas afectadas: preguntas.nivel_dificultad, admin_tests.nivel_dificultad
-- ────────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── 1. Columna nivel_dificultad en preguntas ────────────────────────────────

-- Añadir columna temporal de texto
ALTER TABLE preguntas ADD COLUMN nivel_dificultad_new VARCHAR(10);

-- Mapear valores numéricos → texto
UPDATE preguntas SET nivel_dificultad_new = CASE
  WHEN nivel_dificultad IN (1, 2) THEN 'facil'
  WHEN nivel_dificultad = 3       THEN 'media'
  WHEN nivel_dificultad IN (4, 5) THEN 'dificil'
  ELSE NULL
END;

-- Eliminar columna original y renombrar
ALTER TABLE preguntas DROP COLUMN nivel_dificultad;
ALTER TABLE preguntas RENAME COLUMN nivel_dificultad_new TO nivel_dificultad;

-- Añadir constraint de valores permitidos
ALTER TABLE preguntas
  ADD CONSTRAINT preguntas_nivel_dificultad_check
  CHECK (nivel_dificultad IN ('facil', 'media', 'dificil'));

-- Índice para filtrado eficiente
CREATE INDEX IF NOT EXISTS idx_preguntas_nivel_dificultad
  ON preguntas (nivel_dificultad)
  WHERE nivel_dificultad IS NOT NULL;

-- ─── 2. Columna nivel_dificultad en admin_tests ──────────────────────────────

ALTER TABLE admin_tests ADD COLUMN nivel_dificultad_new VARCHAR(10);

UPDATE admin_tests SET nivel_dificultad_new = CASE
  WHEN nivel_dificultad IN (1, 2) THEN 'facil'
  WHEN nivel_dificultad = 3       THEN 'media'
  WHEN nivel_dificultad IN (4, 5) THEN 'dificil'
  ELSE NULL
END;

ALTER TABLE admin_tests DROP COLUMN nivel_dificultad;
ALTER TABLE admin_tests RENAME COLUMN nivel_dificultad_new TO nivel_dificultad;

ALTER TABLE admin_tests
  ADD CONSTRAINT admin_tests_nivel_dificultad_check
  CHECK (nivel_dificultad IN ('facil', 'media', 'dificil'));

COMMIT;
