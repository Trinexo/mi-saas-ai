-- Migracion 036: reparacion de admin_tests_temas en entornos donde no se aplico la 035
-- Crea la tabla puente multi-tema, sus indices y rellena datos legacy desde admin_tests.tema_id.

CREATE TABLE IF NOT EXISTS admin_tests_temas (
  test_id BIGINT NOT NULL REFERENCES admin_tests(id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, tema_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_tests_temas_test_id
  ON admin_tests_temas (test_id);

CREATE INDEX IF NOT EXISTS idx_admin_tests_temas_tema_id
  ON admin_tests_temas (tema_id);

INSERT INTO admin_tests_temas (test_id, tema_id)
SELECT id, tema_id
FROM admin_tests
WHERE tema_id IS NOT NULL
ON CONFLICT (test_id, tema_id) DO NOTHING;
