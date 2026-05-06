-- Migración 016: sistema de etiquetas para preguntas
-- etiquetas:          catálogo de etiquetas transversales (ej: "Decreto 365", "Tema 12", "Alta rotación")
-- preguntas_etiquetas: relación N:M entre preguntas y etiquetas

CREATE TABLE IF NOT EXISTS etiquetas (
  id          BIGSERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,
  color       TEXT,           -- código hex, ej: '#7c3aed'
  descripcion TEXT,
  creado_por  BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preguntas_etiquetas (
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  etiqueta_id BIGINT NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (pregunta_id, etiqueta_id)
);

CREATE INDEX IF NOT EXISTS idx_etiquetas_nombre       ON etiquetas(nombre);
CREATE INDEX IF NOT EXISTS idx_preg_etiq_pregunta     ON preguntas_etiquetas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_preg_etiq_etiqueta     ON preguntas_etiquetas(etiqueta_id);
