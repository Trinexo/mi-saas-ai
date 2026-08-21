CREATE TABLE IF NOT EXISTS albacer_item_progreso (
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL REFERENCES albacer_modulo_items(id) ON DELETE CASCADE,
  intentos INT NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  superado BOOLEAN NOT NULL DEFAULT FALSE,
  mejor_nota NUMERIC(5,2),
  ultima_nota NUMERIC(5,2),
  ultimo_test_id BIGINT REFERENCES tests(id) ON DELETE SET NULL,
  test_id_mejor_intento BIGINT REFERENCES tests(id) ON DELETE SET NULL,
  iniciado_en TIMESTAMPTZ,
  superado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_albacer_item_progreso_item_superado
  ON albacer_item_progreso(item_id, superado);

WITH intentos AS (
  SELECT
    t.usuario_id,
    t.albacer_item_id AS item_id,
    COUNT(*)::int AS intentos,
    MAX(rt.nota) AS mejor_nota,
    (ARRAY_AGG(rt.nota ORDER BY rt.fecha DESC, rt.id DESC))[1] AS ultima_nota,
    (ARRAY_AGG(t.id ORDER BY rt.fecha DESC, rt.id DESC))[1] AS ultimo_test_id,
    (ARRAY_AGG(t.id ORDER BY rt.nota DESC, rt.fecha ASC, rt.id ASC))[1] AS test_id_mejor_intento,
    MIN(t.fecha_creacion) AS iniciado_en,
    BOOL_OR(rt.nota >= 5.00) AS superado,
    MIN(rt.fecha) FILTER (WHERE rt.nota >= 5.00) AS superado_en,
    MAX(rt.fecha) AS actualizado_en
  FROM tests t
  JOIN resultados_test rt ON rt.test_id = t.id
  JOIN albacer_modulo_items mi ON mi.id = t.albacer_item_id
  WHERE t.modo_preparacion = 'albacer'
    AND mi.tipo = 'test'
    AND mi.obligatorio = TRUE
  GROUP BY t.usuario_id, t.albacer_item_id
)
INSERT INTO albacer_item_progreso (
  usuario_id, item_id, intentos, superado, mejor_nota, ultima_nota,
  ultimo_test_id, test_id_mejor_intento, iniciado_en, superado_en, actualizado_en
)
SELECT
  usuario_id, item_id, intentos, superado, mejor_nota, ultima_nota,
  ultimo_test_id, test_id_mejor_intento, iniciado_en, superado_en, actualizado_en
FROM intentos
ON CONFLICT (usuario_id, item_id) DO NOTHING;
