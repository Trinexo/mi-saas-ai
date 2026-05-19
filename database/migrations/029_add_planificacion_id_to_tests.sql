-- Migracion 029: vincular sesiones de test con Plan de estudio.

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS planificacion_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'tests'::regclass
      AND c.contype = 'f'
      AND a.attname = 'planificacion_id'
  ) THEN
    ALTER TABLE tests
      ADD CONSTRAINT fk_tests_planificacion
      FOREIGN KEY (planificacion_id)
      REFERENCES planificaciones_academicas(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tests_planificacion_usuario
  ON tests(planificacion_id, usuario_id, fecha_creacion DESC)
  WHERE planificacion_id IS NOT NULL;
