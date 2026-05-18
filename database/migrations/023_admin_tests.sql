-- ─── Migración 023: Tabla admin_tests ───────────────────────────────────────
-- Tests curados creados por admin/profesores para asignar a alumnos.
-- DISTINCIÓN: esta tabla ≠ "tests" (sesiones de usuario al hacer un test).
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabla principal
CREATE TABLE IF NOT EXISTS admin_tests (
  id                    BIGSERIAL PRIMARY KEY,
  nombre                TEXT          NOT NULL,
  descripcion           TEXT,
  oposicion_id          BIGINT        REFERENCES oposiciones(id) ON DELETE SET NULL,
  tema_id               BIGINT        REFERENCES temas(id) ON DELETE SET NULL,
  estado                TEXT          NOT NULL DEFAULT 'borrador'
                          CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  nivel_dificultad      SMALLINT      CHECK (nivel_dificultad BETWEEN 1 AND 5),
  duracion_minutos      SMALLINT,

  -- Toggles de configuración
  mezclar_preguntas     BOOLEAN       NOT NULL DEFAULT TRUE,
  mostrar_resultados    BOOLEAN       NOT NULL DEFAULT TRUE,
  mostrar_explicaciones BOOLEAN       NOT NULL DEFAULT TRUE,

  -- Sistema de puntuación
  tipo_puntuacion       TEXT          NOT NULL DEFAULT 'estandar'
                          CHECK (tipo_puntuacion IN ('estandar', 'personalizada')),
  pts_acierto           NUMERIC(5,2)  NOT NULL DEFAULT 1.00,
  pts_fallo             NUMERIC(5,2)  NOT NULL DEFAULT -0.25,
  pts_blanco            NUMERIC(5,2)  NOT NULL DEFAULT 0.00,

  -- Meta
  creado_por            BIGINT        REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  fecha_actualizacion   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Preguntas asignadas al test (M:N ordenadas)
CREATE TABLE IF NOT EXISTS admin_tests_preguntas (
  test_id     BIGINT  NOT NULL REFERENCES admin_tests(id) ON DELETE CASCADE,
  pregunta_id BIGINT  NOT NULL REFERENCES preguntas(id)   ON DELETE CASCADE,
  orden       INT     NOT NULL DEFAULT 0,
  PRIMARY KEY (test_id, pregunta_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_admin_tests_oposicion ON admin_tests(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_tema      ON admin_tests(tema_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_estado    ON admin_tests(estado);
CREATE INDEX IF NOT EXISTS idx_admin_tests_creado_por ON admin_tests(creado_por);
CREATE INDEX IF NOT EXISTS idx_admin_tests_preg_test  ON admin_tests_preguntas(test_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_preg_preg  ON admin_tests_preguntas(pregunta_id);
