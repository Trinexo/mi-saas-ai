-- Migracion 035: soporte multi-tema real en admin_tests
-- Un test puede pertenecer a varios temas de una misma oposicion.

CREATE TABLE IF NOT EXISTS admin_tests_temas (
  test_id BIGINT NOT NULL REFERENCES admin_tests(id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, tema_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_tests_temas_test_id
  ON admin_tests_temas (test_id);

CREATE INDEX IF NOT EXISTS idx_admin_tests_temas_tema_id
  ON admin_tests_temas (tema_id);

-- Backfill desde el antiguo campo tema_id para no perder relaciones ya creadas.
INSERT INTO admin_tests_temas (test_id, tema_id)
SELECT id, tema_id
FROM admin_tests
WHERE tema_id IS NOT NULL
ON CONFLICT (test_id, tema_id) DO NOTHING;
