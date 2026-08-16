-- Migración 043: estados editoriales definitivos de preguntas.

UPDATE preguntas SET estado = 'revision' WHERE estado = 'pendiente';
UPDATE preguntas SET estado = 'cancelada' WHERE estado = 'rechazada';

DO $$
DECLARE constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
      FROM pg_constraint con
     WHERE con.conrelid = 'preguntas'::regclass
       AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%estado%'
  LOOP
    EXECUTE format('ALTER TABLE preguntas DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'preguntas'::regclass
       AND conname = 'chk_preguntas_estado_editorial'
  ) THEN
    ALTER TABLE preguntas
      ADD CONSTRAINT chk_preguntas_estado_editorial
      CHECK (estado IN ('aprobada', 'revision', 'cancelada'));
  END IF;
END $$;

ALTER TABLE preguntas ALTER COLUMN estado SET DEFAULT 'aprobada';
