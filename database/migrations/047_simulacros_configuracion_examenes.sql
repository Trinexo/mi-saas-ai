-- Completa 046 en bases donde fue aplicada antes de soportar varios exámenes.
-- Idempotente: no modifica ni duplica la configuración ya existente.
CREATE TABLE IF NOT EXISTS simulacros_configuracion_examenes (
  simulacro_id BIGINT NOT NULL
    REFERENCES simulacros_configuracion_preguntas(simulacro_id)
    ON DELETE CASCADE,
  examen_id BIGINT NOT NULL
    REFERENCES examenes_oficiales(id)
    ON DELETE RESTRICT,
  CONSTRAINT pk_simulacros_configuracion_examenes
    PRIMARY KEY (simulacro_id, examen_id)
);

CREATE INDEX IF NOT EXISTS idx_sim_config_examenes_examen
  ON simulacros_configuracion_examenes (examen_id, simulacro_id);
