-- Migración 019: Reestructura jerarquía materias/temas → temas/bloques
--
-- Antes:  oposiciones → materias (oposicion_id) → temas (materia_id) → preguntas (tema_id)
-- Después: oposiciones → temas   (oposicion_id) → bloques (tema_id)  → preguntas (bloque_id)
--
-- "materia" pasa a llamarse "tema"  (top-level bajo oposición, sin cambio estructural)
-- "tema"    pasa a llamarse "bloque" (hijo del tema, FK renombrada materia_id → tema_id)

BEGIN;

-- Paso 1: Renombrar 'temas' (antigua tabla hija de materias) a 'bloques'
--         IMPORTANTE: se hace ANTES que el renombrado de materias para evitar colisión de nombres.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'temas'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bloques'
  ) THEN
    ALTER TABLE temas RENAME TO bloques;
  END IF;
END $$;

-- Paso 2: Renombrar 'materias' (antigua tabla hija de oposiciones) a 'temas'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'materias'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'temas'
  ) THEN
    ALTER TABLE materias RENAME TO temas;
  END IF;
END $$;

-- Paso 3: Renombrar la FK de bloques: materia_id → tema_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bloques' AND column_name = 'materia_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bloques' AND column_name = 'tema_id'
  ) THEN
    ALTER TABLE bloques RENAME COLUMN materia_id TO tema_id;
  END IF;
END $$;

-- Paso 4: Renombrar columna en preguntas: tema_id → bloque_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'preguntas' AND column_name = 'tema_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'preguntas' AND column_name = 'bloque_id'
  ) THEN
    ALTER TABLE preguntas RENAME COLUMN tema_id TO bloque_id;
  END IF;
END $$;

-- Paso 5: Renombrar columna en progreso_usuario: tema_id → bloque_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'progreso_usuario' AND column_name = 'tema_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'progreso_usuario' AND column_name = 'bloque_id'
  ) THEN
    ALTER TABLE progreso_usuario RENAME COLUMN tema_id TO bloque_id;
  END IF;
END $$;

-- Paso 6: Renombrar columna en tests: tema_id → bloque_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'tema_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tests' AND column_name = 'bloque_id'
  ) THEN
    ALTER TABLE tests RENAME COLUMN tema_id TO bloque_id;
  END IF;
END $$;

-- Paso 7: Recrear índice sobre la nueva columna
DROP INDEX IF EXISTS idx_preguntas_tema_id;
CREATE INDEX IF NOT EXISTS idx_preguntas_bloque_id ON preguntas(bloque_id);

-- Paso 8: Recrear UNIQUE constraint de progreso_usuario con el nuevo nombre de columna
ALTER TABLE progreso_usuario
  DROP CONSTRAINT IF EXISTS progreso_usuario_usuario_id_tema_id_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'progreso_usuario_usuario_id_bloque_id_key'
  ) THEN
    ALTER TABLE progreso_usuario
      ADD CONSTRAINT progreso_usuario_usuario_id_bloque_id_key UNIQUE (usuario_id, bloque_id);
  END IF;
END $$;

COMMIT;
