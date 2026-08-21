-- Configuración persistente del wizard simplificado de simulacros.
CREATE TABLE IF NOT EXISTS simulacros_configuracion_preguntas (
  simulacro_id BIGINT PRIMARY KEY REFERENCES simulacros(id) ON DELETE CASCADE,
  total_preguntas INTEGER NOT NULL CHECK (total_preguntas > 0),
  dificultad TEXT CHECK (dificultad IS NULL OR dificultad IN ('facil', 'media', 'dificil')),
  officialidad TEXT NOT NULL DEFAULT 'all' CHECK (officialidad IN ('all', 'official', 'non_official')),
  reparto_por_tema BOOLEAN NOT NULL DEFAULT FALSE,
  examen_id BIGINT REFERENCES examenes_oficiales(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS simulacros_configuracion_temas (
  simulacro_id BIGINT NOT NULL REFERENCES simulacros_configuracion_preguntas(simulacro_id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE RESTRICT,
  cantidad INTEGER CHECK (cantidad IS NULL OR cantidad > 0),
  PRIMARY KEY (simulacro_id, tema_id)
);

CREATE TABLE IF NOT EXISTS simulacros_configuracion_anios (
  simulacro_id BIGINT NOT NULL REFERENCES simulacros_configuracion_preguntas(simulacro_id) ON DELETE CASCADE,
  oposicion_anio_id BIGINT NOT NULL REFERENCES oposiciones_anios_oficiales(id) ON DELETE RESTRICT,
  PRIMARY KEY (simulacro_id, oposicion_anio_id)
);

CREATE INDEX IF NOT EXISTS idx_sim_config_temas_tema
  ON simulacros_configuracion_temas (tema_id, simulacro_id);
CREATE INDEX IF NOT EXISTS idx_sim_config_anios_anio
  ON simulacros_configuracion_anios (oposicion_anio_id, simulacro_id);
