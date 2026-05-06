-- Migración 017: módulo de simulacros admin
--
-- simulacros:           cabecera del simulacro (nombre, configuración global)
-- simulacros_bloques:   bloques temáticos dentro del simulacro (cada bloque agrupa preguntas de un área)
-- simulacros_preguntas: preguntas asignadas a cada bloque, en orden

-- ─── simulacros ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulacros (
  id                        BIGSERIAL PRIMARY KEY,
  nombre                    TEXT NOT NULL,
  descripcion               TEXT,
  oposicion_id              BIGINT REFERENCES oposiciones(id) ON DELETE SET NULL,
  estado                    TEXT NOT NULL DEFAULT 'borrador'
                              CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  tiempo_limite_segundos    INTEGER,           -- NULL = sin límite
  puntuacion_maxima         NUMERIC(6,2) NOT NULL DEFAULT 100,
  penalizacion              NUMERIC(4,2) NOT NULL DEFAULT 0,   -- puntos descontados por error
  mostrar_resultados_al_final BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_publicacion         TIMESTAMPTZ,
  creado_por                BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── simulacros_bloques ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulacros_bloques (
  id              BIGSERIAL PRIMARY KEY,
  simulacro_id    BIGINT NOT NULL REFERENCES simulacros(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  orden           SMALLINT NOT NULL DEFAULT 0,
  numero_preguntas INTEGER NOT NULL DEFAULT 0   -- caché calculado, se actualiza al asignar preguntas
);

-- ─── simulacros_preguntas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulacros_preguntas (
  id          BIGSERIAL PRIMARY KEY,
  bloque_id   BIGINT NOT NULL REFERENCES simulacros_bloques(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  orden       SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (bloque_id, pregunta_id)
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_simulacros_oposicion   ON simulacros(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_simulacros_estado      ON simulacros(estado);
CREATE INDEX IF NOT EXISTS idx_simulacros_creado_por  ON simulacros(creado_por);
CREATE INDEX IF NOT EXISTS idx_sim_bloques_simulacro  ON simulacros_bloques(simulacro_id, orden);
CREATE INDEX IF NOT EXISTS idx_sim_preguntas_bloque   ON simulacros_preguntas(bloque_id, orden);
CREATE INDEX IF NOT EXISTS idx_sim_preguntas_pregunta ON simulacros_preguntas(pregunta_id);
