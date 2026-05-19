-- Migracion 026: planificaciones academicas
-- Fuente de producto:
-- - Profesor: modulo "Planificacion"
-- - Alumno: seccion "Plan de estudio"
-- - Tipos MVP: simulacro, plantilla_test, tema_recomendado

CREATE TABLE IF NOT EXISTS planificaciones_academicas (
  id BIGSERIAL PRIMARY KEY,
  creado_por_usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_por_rol TEXT NOT NULL DEFAULT 'profesor',
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  destinatario_tipo TEXT NOT NULL DEFAULT 'oposicion'
    CHECK (destinatario_tipo IN ('oposicion')),
  tipo TEXT NOT NULL
    CHECK (tipo IN ('simulacro', 'plantilla_test', 'tema_recomendado')),
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'publicada', 'archivada')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  duracion_minutos INT,
  simulacro_id BIGINT REFERENCES simulacros(id) ON DELETE SET NULL,
  plantilla_test_id BIGINT REFERENCES admin_tests(id) ON DELETE SET NULL,
  numero_preguntas INT,
  dificultad TEXT,
  modo_test TEXT,
  intentos_maximos INT,
  permitir_reintento BOOLEAN NOT NULL DEFAULT TRUE,
  resultados_visibles_desde TEXT NOT NULL DEFAULT 'inmediato'
    CHECK (resultados_visibles_desde IN ('inmediato', 'cierre')),
  revision_visible_desde TEXT NOT NULL DEFAULT 'inmediato'
    CHECK (revision_visible_desde IN ('inmediato', 'cierre', 'nunca')),
  notificar_alumnos BOOLEAN NOT NULL DEFAULT FALSE,
  notificada_en TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planificacion_academica_temas (
  planificacion_id BIGINT NOT NULL REFERENCES planificaciones_academicas(id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (planificacion_id, tema_id)
);

CREATE INDEX IF NOT EXISTS idx_planificaciones_academicas_oposicion_fecha
  ON planificaciones_academicas (oposicion_id, fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_planificaciones_academicas_autor_fecha
  ON planificaciones_academicas (creado_por_usuario_id, fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_planificaciones_academicas_estado_fecha
  ON planificaciones_academicas (estado, fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_planificacion_academica_temas_tema
  ON planificacion_academica_temas (tema_id);
