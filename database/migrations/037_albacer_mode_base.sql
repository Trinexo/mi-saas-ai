-- Migracion 037: base de Modo Experto / Modo Albacer
-- No elimina planificaciones legacy; solo prepara el nuevo modelo guiado por modulos.

-- 1) Acceso por oposicion: tipo de alumno y modo activo.
ALTER TABLE accesos_oposicion
  ADD COLUMN IF NOT EXISTS tipo_alumno TEXT NOT NULL DEFAULT 'libre';

ALTER TABLE accesos_oposicion
  ADD COLUMN IF NOT EXISTS modo_preparacion TEXT NOT NULL DEFAULT 'albacer';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_accesos_oposicion_tipo_alumno'
  ) THEN
    ALTER TABLE accesos_oposicion
      ADD CONSTRAINT chk_accesos_oposicion_tipo_alumno
      CHECK (tipo_alumno IN ('libre', 'albacer'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_accesos_oposicion_modo_preparacion'
  ) THEN
    ALTER TABLE accesos_oposicion
      ADD CONSTRAINT chk_accesos_oposicion_modo_preparacion
      CHECK (modo_preparacion IN ('experto', 'albacer'));
  END IF;
END $$;

-- 2) Modulos Albacer.
CREATE TABLE IF NOT EXISTS albacer_modulos (
  id BIGSERIAL PRIMARY KEY,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orden INT NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  creado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_por_rol TEXT NOT NULL DEFAULT 'profesor',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS albacer_modulo_temas (
  modulo_id BIGINT NOT NULL REFERENCES albacer_modulos(id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (modulo_id, tema_id)
);

CREATE TABLE IF NOT EXISTS albacer_modulo_items (
  id BIGSERIAL PRIMARY KEY,
  modulo_id BIGINT NOT NULL REFERENCES albacer_modulos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('test', 'simulacro_final')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  plantilla_test_id BIGINT REFERENCES admin_tests(id) ON DELETE SET NULL,
  simulacro_id BIGINT REFERENCES simulacros(id) ON DELETE SET NULL,
  orden INT NOT NULL DEFAULT 0,
  obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS albacer_modulo_progreso (
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_id BIGINT NOT NULL REFERENCES albacer_modulos(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'disponible'
    CHECK (estado IN ('bloqueado', 'disponible', 'superado')),
  mejor_nota NUMERIC(5,2),
  mejor_porcentaje NUMERIC(5,2),
  test_id_mejor_intento BIGINT REFERENCES tests(id) ON DELETE SET NULL,
  superado_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, modulo_id)
);

-- 3) Contexto Albacer en sesiones reales de tests.
ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS modo_preparacion TEXT NOT NULL DEFAULT 'experto';

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS albacer_modulo_id BIGINT;

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS albacer_item_id BIGINT;

ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS scoring_snapshot JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_tests_modo_preparacion'
  ) THEN
    ALTER TABLE tests
      ADD CONSTRAINT chk_tests_modo_preparacion
      CHECK (modo_preparacion IN ('experto', 'albacer'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tests_albacer_modulo'
  ) THEN
    ALTER TABLE tests
      ADD CONSTRAINT fk_tests_albacer_modulo
      FOREIGN KEY (albacer_modulo_id)
      REFERENCES albacer_modulos(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tests_albacer_item'
  ) THEN
    ALTER TABLE tests
      ADD CONSTRAINT fk_tests_albacer_item
      FOREIGN KEY (albacer_item_id)
      REFERENCES albacer_modulo_items(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Scope Albacer en plantillas de test.
ALTER TABLE admin_tests
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'experto';

ALTER TABLE admin_tests
  ADD COLUMN IF NOT EXISTS albacer_modulo_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_admin_tests_scope'
  ) THEN
    ALTER TABLE admin_tests
      ADD CONSTRAINT chk_admin_tests_scope
      CHECK (scope IN ('experto', 'albacer_modulo', 'sugerido_profesor'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_tests_albacer_modulo'
  ) THEN
    ALTER TABLE admin_tests
      ADD CONSTRAINT fk_admin_tests_albacer_modulo
      FOREIGN KEY (albacer_modulo_id)
      REFERENCES albacer_modulos(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 5) Scope Albacer en simulacros.
ALTER TABLE simulacros
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'experto';

ALTER TABLE simulacros
  ADD COLUMN IF NOT EXISTS albacer_modulo_id BIGINT;

ALTER TABLE simulacros
  ADD COLUMN IF NOT EXISTS criterio_superacion TEXT NOT NULL DEFAULT 'nota';

ALTER TABLE simulacros
  ADD COLUMN IF NOT EXISTS valor_superacion NUMERIC(6,2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_simulacros_scope'
  ) THEN
    ALTER TABLE simulacros
      ADD CONSTRAINT chk_simulacros_scope
      CHECK (scope IN ('experto', 'albacer_modulo_final', 'sugerido_profesor'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_simulacros_criterio_superacion'
  ) THEN
    ALTER TABLE simulacros
      ADD CONSTRAINT chk_simulacros_criterio_superacion
      CHECK (criterio_superacion IN ('nota', 'porcentaje'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_simulacros_albacer_modulo'
  ) THEN
    ALTER TABLE simulacros
      ADD CONSTRAINT fk_simulacros_albacer_modulo
      FOREIGN KEY (albacer_modulo_id)
      REFERENCES albacer_modulos(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 6) Indices.
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_tipo_modo
  ON accesos_oposicion(oposicion_id, tipo_alumno, modo_preparacion);

CREATE INDEX IF NOT EXISTS idx_albacer_modulos_oposicion_orden
  ON albacer_modulos(oposicion_id, orden, id);

CREATE INDEX IF NOT EXISTS idx_albacer_modulos_estado
  ON albacer_modulos(estado);

CREATE INDEX IF NOT EXISTS idx_albacer_modulo_temas_tema
  ON albacer_modulo_temas(tema_id);

CREATE INDEX IF NOT EXISTS idx_albacer_modulo_items_modulo_orden
  ON albacer_modulo_items(modulo_id, orden, id);

CREATE INDEX IF NOT EXISTS idx_albacer_modulo_items_test
  ON albacer_modulo_items(plantilla_test_id)
  WHERE plantilla_test_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_albacer_modulo_items_simulacro
  ON albacer_modulo_items(simulacro_id)
  WHERE simulacro_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_albacer_modulo_progreso_modulo_estado
  ON albacer_modulo_progreso(modulo_id, estado);

CREATE INDEX IF NOT EXISTS idx_tests_modo_oposicion_fecha
  ON tests(modo_preparacion, oposicion_id, fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_tests_albacer_modulo_usuario
  ON tests(albacer_modulo_id, usuario_id, fecha_creacion DESC)
  WHERE albacer_modulo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tests_albacer_item_usuario
  ON tests(albacer_item_id, usuario_id, fecha_creacion DESC)
  WHERE albacer_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_tests_scope_modulo
  ON admin_tests(scope, albacer_modulo_id)
  WHERE albacer_modulo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_simulacros_scope_modulo
  ON simulacros(scope, albacer_modulo_id)
  WHERE albacer_modulo_id IS NOT NULL;
