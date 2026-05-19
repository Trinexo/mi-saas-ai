-- Migracion 027: alinear schema del workspace profesor con el modelo actual.
-- Modelo oficial: oposiciones -> temas -> preguntas -> tests / simulacros.

CREATE TABLE IF NOT EXISTS profesores_oposiciones (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, oposicion_id)
);

CREATE INDEX IF NOT EXISTS idx_profesores_oposiciones_user_id
  ON profesores_oposiciones(user_id);

CREATE INDEX IF NOT EXISTS idx_profesores_oposiciones_oposicion_id
  ON profesores_oposiciones(oposicion_id);

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS tema_id BIGINT REFERENCES temas(id) ON DELETE SET NULL;

UPDATE tests t
SET tema_id = b.tema_id
FROM bloques b
WHERE t.tema_id IS NULL
  AND t.bloque_id = b.id;

CREATE INDEX IF NOT EXISTS idx_tests_tema ON tests(tema_id);
CREATE INDEX IF NOT EXISTS idx_tests_usuario_tema ON tests(usuario_id, tema_id, fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_temas_oposicion ON temas(oposicion_id);
