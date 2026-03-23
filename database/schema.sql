CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'alumno',
  oposicion_preferida_id BIGINT,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oposiciones (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS materias (
  id BIGSERIAL PRIMARY KEY,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS temas (
  id BIGSERIAL PRIMARY KEY,
  materia_id BIGINT NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preguntas (
  id BIGSERIAL PRIMARY KEY,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  explicacion TEXT NOT NULL,
  referencia_normativa TEXT,
  nivel_dificultad SMALLINT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'aprobada' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opciones_respuesta (
  id BIGSERIAL PRIMARY KEY,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  correcta BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tests (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tema_id BIGINT REFERENCES temas(id),
  oposicion_id BIGINT REFERENCES oposiciones(id),
  tipo_test TEXT NOT NULL,
  numero_preguntas INTEGER NOT NULL,
  duracion_segundos INTEGER,
  estado TEXT NOT NULL DEFAULT 'generado',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tests_preguntas (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id),
  orden INTEGER NOT NULL,
  UNIQUE (test_id, pregunta_id)
);

CREATE TABLE IF NOT EXISTS respuestas_usuario (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id),
  respuesta_id BIGINT REFERENCES opciones_respuesta(id),
  correcta BOOLEAN NOT NULL,
  fecha_respuesta TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resultados_test (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT NOT NULL UNIQUE REFERENCES tests(id) ON DELETE CASCADE,
  aciertos INTEGER NOT NULL,
  errores INTEGER NOT NULL,
  blancos INTEGER NOT NULL,
  nota NUMERIC(5,2) NOT NULL,
  tiempo_segundos INTEGER NOT NULL DEFAULT 0,
  fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progreso_usuario (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  preguntas_vistas INTEGER NOT NULL DEFAULT 0,
  aciertos INTEGER NOT NULL DEFAULT 0,
  errores INTEGER NOT NULL DEFAULT 0,
  tiempo_medio INTEGER NOT NULL DEFAULT 0,
  UNIQUE (usuario_id, tema_id)
);

CREATE TABLE IF NOT EXISTS reportes_preguntas (
  id BIGSERIAL PRIMARY KEY,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preguntas_tema_id ON preguntas(tema_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_nivel_dificultad ON preguntas(nivel_dificultad);
CREATE INDEX IF NOT EXISTS idx_preguntas_estado ON preguntas(estado);
CREATE INDEX IF NOT EXISTS idx_tests_usuario_fecha ON tests(usuario_id, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_pregunta ON respuestas_usuario(test_id, pregunta_id);
CREATE INDEX IF NOT EXISTS idx_materias_oposicion ON materias(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_temas_materia ON temas(materia_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_preguntas(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_pregunta ON reportes_preguntas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado_fecha_id ON reportes_preguntas(estado, fecha_creacion DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tests_usuario_finalizados ON tests(usuario_id, id) WHERE estado = 'finalizado';

CREATE TABLE IF NOT EXISTS auditoria_preguntas (
  id BIGSERIAL PRIMARY KEY,
  accion TEXT NOT NULL CHECK (accion IN ('create', 'update', 'delete')),
  pregunta_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  usuario_role TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  datos_anteriores JSONB
);

CREATE INDEX IF NOT EXISTS idx_auditoria_pregunta ON auditoria_preguntas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_preguntas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_preguntas(fecha DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_scoring ON respuestas_usuario(pregunta_id, test_id, correcta, fecha_respuesta DESC);
CREATE INDEX IF NOT EXISTS idx_tests_usuario_tema ON tests(usuario_id, tema_id, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_preguntas_tema_dificultad ON preguntas(tema_id, nivel_dificultad);

CREATE TABLE IF NOT EXISTS repeticion_espaciada (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  nivel_memoria SMALLINT NOT NULL DEFAULT 0,
  proxima_revision TIMESTAMP NOT NULL DEFAULT NOW(),
  ultima_revision TIMESTAMP NOT NULL DEFAULT NOW(),
  racha_aciertos SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (usuario_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_repaso_usuario_proxima ON repeticion_espaciada(usuario_id, proxima_revision);
CREATE INDEX IF NOT EXISTS idx_repaso_pregunta ON repeticion_espaciada(pregunta_id);

-- FK diferida: usuarios.oposicion_preferida_id -> oposiciones.id
ALTER TABLE usuarios
  ADD CONSTRAINT IF NOT EXISTS fk_usuarios_oposicion_preferida
  FOREIGN KEY (oposicion_preferida_id) REFERENCES oposiciones(id) ON DELETE SET NULL;
