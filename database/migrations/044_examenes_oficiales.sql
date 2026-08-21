-- Migración 044: procedencia editorial de preguntas de exámenes oficiales.

CREATE TABLE IF NOT EXISTS examenes_oficiales (
  id BIGSERIAL PRIMARY KEY,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE RESTRICT,
  nombre TEXT NOT NULL,
  anio SMALLINT NOT NULL CHECK (anio BETWEEN 1900 AND 2200),
  convocatoria TEXT,
  fecha DATE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_examenes_oficiales_identidad
  ON examenes_oficiales (
    oposicion_id,
    anio,
    lower(nombre),
    coalesce(lower(convocatoria), '')
  );

CREATE INDEX IF NOT EXISTS idx_examenes_oficiales_oposicion
  ON examenes_oficiales (oposicion_id);

CREATE INDEX IF NOT EXISTS idx_examenes_oficiales_oposicion_anio
  ON examenes_oficiales (oposicion_id, anio);

CREATE TABLE IF NOT EXISTS examenes_oficiales_preguntas (
  examen_id BIGINT NOT NULL REFERENCES examenes_oficiales(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE RESTRICT,
  orden INTEGER CHECK (orden IS NULL OR orden > 0),
  PRIMARY KEY (examen_id, pregunta_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_examen_oficial_pregunta_orden
  ON examenes_oficiales_preguntas (examen_id, orden)
  WHERE orden IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_examenes_oficiales_pregunta
  ON examenes_oficiales_preguntas (pregunta_id, examen_id);

CREATE OR REPLACE FUNCTION fn_validate_examen_oficial_pregunta_oposicion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  examen_oposicion BIGINT;
  pregunta_oposicion BIGINT;
BEGIN
  SELECT oposicion_id INTO examen_oposicion
    FROM examenes_oficiales WHERE id = NEW.examen_id;

  SELECT t.oposicion_id INTO pregunta_oposicion
    FROM preguntas p
    JOIN temas t ON t.id = p.tema_id
   WHERE p.id = NEW.pregunta_id;

  IF examen_oposicion IS NULL OR pregunta_oposicion IS NULL
     OR examen_oposicion <> pregunta_oposicion THEN
    RAISE EXCEPTION 'El examen y la pregunta deben pertenecer a la misma oposición'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_examen_oficial_pregunta_oposicion
  ON examenes_oficiales_preguntas;
CREATE TRIGGER trg_validate_examen_oficial_pregunta_oposicion
BEFORE INSERT OR UPDATE ON examenes_oficiales_preguntas
FOR EACH ROW EXECUTE FUNCTION fn_validate_examen_oficial_pregunta_oposicion();

CREATE OR REPLACE FUNCTION fn_prevent_incompatible_pregunta_examen_oposicion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  pregunta_oposicion BIGINT;
BEGIN
  SELECT t.oposicion_id INTO pregunta_oposicion
    FROM temas t WHERE t.id = NEW.tema_id;

  IF EXISTS (
    SELECT 1
      FROM examenes_oficiales_preguntas eop
      JOIN examenes_oficiales eo ON eo.id = eop.examen_id
     WHERE eop.pregunta_id = NEW.id
       AND eo.oposicion_id <> pregunta_oposicion
  ) THEN
    RAISE EXCEPTION 'La pregunta no puede moverse a otra oposición mientras esté asociada a un examen oficial'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_incompatible_pregunta_examen_oposicion
  ON preguntas;
CREATE TRIGGER trg_prevent_incompatible_pregunta_examen_oposicion
BEFORE UPDATE OF tema_id ON preguntas
FOR EACH ROW EXECUTE FUNCTION fn_prevent_incompatible_pregunta_examen_oposicion();

CREATE OR REPLACE FUNCTION fn_prevent_incompatible_examen_oposicion_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM examenes_oficiales_preguntas eop
      JOIN preguntas p ON p.id = eop.pregunta_id
      JOIN temas t ON t.id = p.tema_id
     WHERE eop.examen_id = NEW.id
       AND t.oposicion_id <> NEW.oposicion_id
  ) THEN
    RAISE EXCEPTION 'El examen no puede cambiar de oposición mientras tenga preguntas asociadas'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_incompatible_examen_oposicion_update
  ON examenes_oficiales;
CREATE TRIGGER trg_prevent_incompatible_examen_oposicion_update
BEFORE UPDATE OF oposicion_id ON examenes_oficiales
FOR EACH ROW EXECUTE FUNCTION fn_prevent_incompatible_examen_oposicion_update();

-- Catálogo canónico de años oficiales por oposición. Los exámenes/convocatorias
-- siguen siendo opcionales y no son la fuente de oficialidad de una pregunta.
CREATE TABLE IF NOT EXISTS oposiciones_anios_oficiales (
  id BIGSERIAL PRIMARY KEY,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  anio SMALLINT NOT NULL CHECK (anio BETWEEN 1900 AND 2200),
  UNIQUE (oposicion_id, anio)
);

CREATE INDEX IF NOT EXISTS idx_oposiciones_anios_oficiales_oposicion
  ON oposiciones_anios_oficiales (oposicion_id, anio DESC);

CREATE TABLE IF NOT EXISTS preguntas_anios_oficiales (
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  oposicion_anio_id BIGINT NOT NULL REFERENCES oposiciones_anios_oficiales(id) ON DELETE CASCADE,
  PRIMARY KEY (pregunta_id, oposicion_anio_id)
);

CREATE INDEX IF NOT EXISTS idx_preguntas_anios_oficiales_anio
  ON preguntas_anios_oficiales (oposicion_anio_id, pregunta_id);

CREATE OR REPLACE FUNCTION fn_validate_pregunta_anio_oficial_oposicion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  pregunta_oposicion BIGINT;
  anio_oposicion BIGINT;
BEGIN
  SELECT t.oposicion_id INTO pregunta_oposicion
    FROM preguntas p JOIN temas t ON t.id = p.tema_id
   WHERE p.id = NEW.pregunta_id;
  SELECT oposicion_id INTO anio_oposicion
    FROM oposiciones_anios_oficiales WHERE id = NEW.oposicion_anio_id;
  IF pregunta_oposicion IS NULL OR anio_oposicion IS NULL
     OR pregunta_oposicion <> anio_oposicion THEN
    RAISE EXCEPTION 'La pregunta y el año oficial deben pertenecer a la misma oposición'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_pregunta_anio_oficial_oposicion
  ON preguntas_anios_oficiales;
CREATE TRIGGER trg_validate_pregunta_anio_oficial_oposicion
BEFORE INSERT OR UPDATE ON preguntas_anios_oficiales
FOR EACH ROW EXECUTE FUNCTION fn_validate_pregunta_anio_oficial_oposicion();

CREATE OR REPLACE FUNCTION fn_prevent_incompatible_pregunta_anio_oficial_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM preguntas_anios_oficiales pao
      JOIN oposiciones_anios_oficiales oao ON oao.id = pao.oposicion_anio_id
     WHERE pao.pregunta_id = NEW.id
       AND oao.oposicion_id <> (SELECT t.oposicion_id FROM temas t WHERE t.id = NEW.tema_id)
  ) THEN
    RAISE EXCEPTION 'La pregunta no puede cambiar de oposición mientras tenga años oficiales asociados'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_incompatible_pregunta_anio_oficial_update
  ON preguntas;
CREATE TRIGGER trg_prevent_incompatible_pregunta_anio_oficial_update
BEFORE UPDATE OF tema_id ON preguntas
FOR EACH ROW EXECUTE FUNCTION fn_prevent_incompatible_pregunta_anio_oficial_update();

-- Un examen pertenece de forma inequívoca al catálogo de años de su oposición.
ALTER TABLE examenes_oficiales
  ADD COLUMN IF NOT EXISTS oposicion_anio_id BIGINT;

INSERT INTO oposiciones_anios_oficiales (oposicion_id, anio)
SELECT DISTINCT eo.oposicion_id, eo.anio
  FROM examenes_oficiales eo
 WHERE NOT EXISTS (
   SELECT 1 FROM oposiciones_anios_oficiales oao
    WHERE oao.oposicion_id = eo.oposicion_id AND oao.anio = eo.anio
 );

UPDATE examenes_oficiales eo
   SET oposicion_anio_id = oao.id
  FROM oposiciones_anios_oficiales oao
 WHERE oao.oposicion_id = eo.oposicion_id
   AND oao.anio = eo.anio
   AND eo.oposicion_anio_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'examenes_oficiales'::regclass
       AND conname = 'fk_examenes_oficiales_oposicion_anio'
  ) THEN
    ALTER TABLE examenes_oficiales
      ADD CONSTRAINT fk_examenes_oficiales_oposicion_anio
      FOREIGN KEY (oposicion_anio_id)
      REFERENCES oposiciones_anios_oficiales(id) ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE examenes_oficiales
  ALTER COLUMN oposicion_anio_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_examenes_oficiales_oposicion_anio_id
  ON examenes_oficiales (oposicion_anio_id);

CREATE OR REPLACE FUNCTION fn_validate_examen_oficial_oposicion_anio()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  anio_oposicion BIGINT;
  anio_catalogo SMALLINT;
BEGIN
  SELECT oposicion_id, anio INTO anio_oposicion, anio_catalogo
    FROM oposiciones_anios_oficiales WHERE id = NEW.oposicion_anio_id;
  IF anio_oposicion IS NULL OR anio_oposicion <> NEW.oposicion_id
     OR anio_catalogo <> NEW.anio THEN
    RAISE EXCEPTION 'El examen debe pertenecer al año oficial de su oposición'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_examen_oficial_oposicion_anio
  ON examenes_oficiales;
CREATE TRIGGER trg_validate_examen_oficial_oposicion_anio
BEFORE INSERT OR UPDATE OF oposicion_id, oposicion_anio_id, anio
ON examenes_oficiales
FOR EACH ROW EXECUTE FUNCTION fn_validate_examen_oficial_oposicion_anio();

CREATE OR REPLACE FUNCTION fn_validate_examen_oficial_pregunta_anio()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM examenes_oficiales eo
      JOIN preguntas_anios_oficiales pao
        ON pao.oposicion_anio_id = eo.oposicion_anio_id
     WHERE eo.id = NEW.examen_id
       AND pao.pregunta_id = NEW.pregunta_id
  ) THEN
    RAISE EXCEPTION 'La pregunta debe estar asociada al año oficial del examen'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_examen_oficial_pregunta_anio
  ON examenes_oficiales_preguntas;
CREATE TRIGGER trg_validate_examen_oficial_pregunta_anio
BEFORE INSERT OR UPDATE ON examenes_oficiales_preguntas
FOR EACH ROW EXECUTE FUNCTION fn_validate_examen_oficial_pregunta_anio();
