-- ==========================================================================
-- MIGRACIÓN 022: bloques → colecciones + tema_id directo en preguntas + M:N
-- ==========================================================================
-- Objetivo:
--   1. Renombrar la tabla `bloques` a `colecciones` (mismo concepto, nuevo nombre)
--   2. Añadir columnas descriptivas a `colecciones` (descripcion, creado_por, publica)
--   3. Añadir `preguntas.tema_id` para asignación directa sin necesidad de colección
--   4. Poblar `tema_id` en preguntas existentes (via JOIN con colecciones)
--   5. Hacer `preguntas.bloque_id` nullable (colección ya no es obligatoria)
--   6. Crear tabla junction `colecciones_preguntas` (M:N preguntas ↔ colecciones)
--   7. Poblar `colecciones_preguntas` desde el antiguo `bloque_id`
--   8. Crear VIEW `bloques` → alias de `colecciones` para compatibilidad con JOINs existentes
--   9. Añadir endpoint-friendly: índices, constraints
-- ==========================================================================

-- 1. Renombrar bloques → colecciones
--    PostgreSQL actualiza automáticamente todas las FK que apuntan a bloques
ALTER TABLE bloques RENAME TO colecciones;

-- 2. Añadir columnas descriptivas
ALTER TABLE colecciones
  ADD COLUMN IF NOT EXISTS descripcion    TEXT,
  ADD COLUMN IF NOT EXISTS creado_por     BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publica        BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Añadir tema_id directamente en preguntas
ALTER TABLE preguntas
  ADD COLUMN IF NOT EXISTS tema_id BIGINT REFERENCES temas(id) ON DELETE RESTRICT;

-- 4. Poblar tema_id desde el bloque actual de cada pregunta
UPDATE preguntas p
SET tema_id = c.tema_id
FROM colecciones c
WHERE c.id = p.bloque_id
  AND p.tema_id IS NULL;

-- 5. Ahora tema_id puede ser NOT NULL (todas las existentes ya lo tienen)
ALTER TABLE preguntas ALTER COLUMN tema_id SET NOT NULL;

-- 6. Hacer bloque_id nullable (las nuevas preguntas pueden no tener colección)
ALTER TABLE preguntas ALTER COLUMN bloque_id DROP NOT NULL;

-- 7. Crear tabla junction colecciones_preguntas (M:N)
CREATE TABLE IF NOT EXISTS colecciones_preguntas (
  coleccion_id BIGINT NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
  pregunta_id  BIGINT NOT NULL REFERENCES preguntas(id)   ON DELETE CASCADE,
  orden        INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (coleccion_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_col_preg_coleccion ON colecciones_preguntas(coleccion_id);
CREATE INDEX IF NOT EXISTS idx_col_preg_pregunta  ON colecciones_preguntas(pregunta_id);

-- 8. Poblar colecciones_preguntas desde bloque_id existente
INSERT INTO colecciones_preguntas (coleccion_id, pregunta_id)
SELECT bloque_id, id
FROM preguntas
WHERE bloque_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 9. Índice en preguntas.tema_id (nuevo campo, muy consultado)
CREATE INDEX IF NOT EXISTS idx_preguntas_tema_id ON preguntas(tema_id);

-- 10. VIEW bloques → colecciones (compatibilidad hacia atrás para todos los SELECT...JOIN bloques)
CREATE OR REPLACE VIEW bloques AS
  SELECT id, tema_id, nombre, descripcion, creado_por, publica FROM colecciones;

-- 11. Renombrar índice de bloque_id en colecciones si existe (era idx_bloques_tema_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bloques_tema_id') THEN
    ALTER INDEX idx_bloques_tema_id RENAME TO idx_colecciones_tema_id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_colecciones_tema_id    ON colecciones(tema_id);
CREATE INDEX IF NOT EXISTS idx_colecciones_creado_por ON colecciones(creado_por);
