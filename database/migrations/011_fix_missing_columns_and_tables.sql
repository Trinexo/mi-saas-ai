-- Migración 011: añadir columnas y tablas faltantes para alinear BD con schema.sql
-- Estas columnas/tablas existen en schema.sql pero no se aplicaron en la BD inicial

-- ─── tests: columnas oposicion_id y duracion_segundos ────────────────────────
ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS oposicion_id BIGINT REFERENCES oposiciones(id) ON DELETE SET NULL;

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS duracion_segundos INTEGER;

CREATE INDEX IF NOT EXISTS idx_tests_oposicion ON tests(oposicion_id);

-- ─── preguntas_marcadas ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS preguntas_marcadas (
  id            BIGSERIAL PRIMARY KEY,
  usuario_id    BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pregunta_id   BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  fecha_marcado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_marcadas_usuario ON preguntas_marcadas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_marcadas_pregunta ON preguntas_marcadas(pregunta_id);

-- ─── auditoria_preguntas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria_preguntas (
  id               BIGSERIAL PRIMARY KEY,
  accion           TEXT NOT NULL CHECK (accion IN ('create', 'update', 'delete')),
  pregunta_id      BIGINT NOT NULL,
  usuario_id       BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_role     TEXT NOT NULL,
  fecha            TIMESTAMP NOT NULL DEFAULT NOW(),
  datos_anteriores JSONB
);

CREATE INDEX IF NOT EXISTS idx_auditoria_pregunta ON auditoria_preguntas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario  ON auditoria_preguntas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha    ON auditoria_preguntas(fecha DESC, id DESC);
