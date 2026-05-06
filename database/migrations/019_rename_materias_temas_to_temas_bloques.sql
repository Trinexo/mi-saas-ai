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
ALTER TABLE temas RENAME TO bloques;

-- Paso 2: Renombrar 'materias' (antigua tabla hija de oposiciones) a 'temas'
ALTER TABLE materias RENAME TO temas;

-- Paso 3: Renombrar la FK de bloques: materia_id → tema_id
ALTER TABLE bloques RENAME COLUMN materia_id TO tema_id;

-- Paso 4: Renombrar columna en preguntas: tema_id → bloque_id
ALTER TABLE preguntas RENAME COLUMN tema_id TO bloque_id;

-- Paso 5: Renombrar columna en progreso_usuario: tema_id → bloque_id
ALTER TABLE progreso_usuario RENAME COLUMN tema_id TO bloque_id;

-- Paso 6: Renombrar columna en tests: tema_id → bloque_id
ALTER TABLE tests RENAME COLUMN tema_id TO bloque_id;

-- Paso 7: Recrear índice sobre la nueva columna
DROP INDEX IF EXISTS idx_preguntas_tema_id;
CREATE INDEX IF NOT EXISTS idx_preguntas_bloque_id ON preguntas(bloque_id);

-- Paso 8: Recrear UNIQUE constraint de progreso_usuario con el nuevo nombre de columna
ALTER TABLE progreso_usuario
  DROP CONSTRAINT IF EXISTS progreso_usuario_usuario_id_tema_id_key;
ALTER TABLE progreso_usuario
  ADD CONSTRAINT progreso_usuario_usuario_id_bloque_id_key UNIQUE (usuario_id, bloque_id);

COMMIT;
