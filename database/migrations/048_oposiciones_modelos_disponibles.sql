-- Configuración global de modalidades por oposición.
-- Las oposiciones existentes conservan el comportamiento anterior: ambos modos.
ALTER TABLE oposiciones
  ADD COLUMN IF NOT EXISTS modelos_disponibles TEXT[];

UPDATE oposiciones
   SET modelos_disponibles = ARRAY['experto', 'guiado']::TEXT[]
 WHERE modelos_disponibles IS NULL;

ALTER TABLE oposiciones
  ALTER COLUMN modelos_disponibles SET DEFAULT ARRAY['experto', 'guiado']::TEXT[],
  ALTER COLUMN modelos_disponibles SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'oposiciones'::regclass
       AND conname = 'chk_oposiciones_modelos_disponibles'
  ) THEN
    ALTER TABLE oposiciones
      ADD CONSTRAINT chk_oposiciones_modelos_disponibles
      CHECK (
        modelos_disponibles IN (
          ARRAY['experto']::TEXT[],
          ARRAY['guiado']::TEXT[],
          ARRAY['experto', 'guiado']::TEXT[],
          ARRAY['guiado', 'experto']::TEXT[]
        )
      );
  END IF;
END $$;
