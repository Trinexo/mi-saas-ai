-- Snapshot estructural oficial posterior a 042_commercial_access_history.sql.
-- Los datos demo/CI viven exclusivamente en database/seed.sql.

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'alumno',
  oposicion_preferida_id BIGINT,
  objetivo_diario_preguntas INT NOT NULL DEFAULT 10,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_not_deleted
  ON usuarios(id) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS oposiciones (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  precio_mensual_cents INT NOT NULL DEFAULT 2900,
  tiempo_limite_minutos INT CHECK (tiempo_limite_minutos > 0 AND tiempo_limite_minutos <= 600),
  slug VARCHAR(200) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'borrador', 'inactiva'))
);

CREATE TABLE IF NOT EXISTS temas (
  id BIGSERIAL PRIMARY KEY,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS colecciones (
  id BIGSERIAL PRIMARY KEY,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  creado_por BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  publica BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE VIEW bloques AS
SELECT id, tema_id, nombre, descripcion, creado_por, publica
FROM colecciones;

CREATE TABLE IF NOT EXISTS preguntas (
  id BIGSERIAL PRIMARY KEY,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE RESTRICT,
  bloque_id BIGINT REFERENCES colecciones(id) ON DELETE SET NULL,
  enunciado TEXT NOT NULL,
  explicacion TEXT NOT NULL,
  referencia_normativa TEXT,
  nivel_dificultad VARCHAR(10) NOT NULL
    CHECK (nivel_dificultad IN ('facil', 'media', 'dificil')),
  estado TEXT NOT NULL DEFAULT 'aprobada'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
  es_oficial BOOLEAN NOT NULL DEFAULT FALSE,
  puntos NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  tipo_pregunta TEXT NOT NULL DEFAULT 'opcion_multiple'
    CHECK (tipo_pregunta IN ('opcion_multiple', 'verdadero_falso', 'texto_libre')),
  imagen_url TEXT,
  audio_url TEXT
);

CREATE TABLE IF NOT EXISTS colecciones_preguntas (
  coleccion_id BIGINT NOT NULL REFERENCES colecciones(id) ON DELETE CASCADE,
  pregunta_id  BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  orden        INT    NOT NULL DEFAULT 0,
  PRIMARY KEY (coleccion_id, pregunta_id)
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
  planificacion_id BIGINT,
  tema_id BIGINT REFERENCES temas(id),
  bloque_id BIGINT REFERENCES colecciones(id),
  oposicion_id BIGINT REFERENCES oposiciones(id),
  modo_preparacion TEXT NOT NULL DEFAULT 'experto'
    CHECK (modo_preparacion IN ('experto', 'albacer')),
  albacer_modulo_id BIGINT,
  albacer_item_id BIGINT,
  scoring_snapshot JSONB,
  tipo_test TEXT NOT NULL,
  numero_preguntas INTEGER NOT NULL,
  duracion_segundos INTEGER,
  estado TEXT NOT NULL DEFAULT 'generado',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMPTZ
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

CREATE TABLE IF NOT EXISTS accesos_oposicion (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'activo',
  fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMP,
  precio_pagado NUMERIC(8,2),
  notas TEXT,
  stripe_session_id TEXT,
  tipo_alumno TEXT NOT NULL DEFAULT 'libre'
    CHECK (tipo_alumno IN ('libre', 'albacer')),
  modo_preparacion TEXT NOT NULL DEFAULT 'albacer'
    CHECK (modo_preparacion IN ('experto', 'albacer')),
  modo_activo TEXT,
  ranking_publico BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizada_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_accesos_oposicion_estado_fase1
    CHECK (estado IN ('pendiente_modo', 'activo', 'expirado', 'revocado', 'cancelado')),
  CONSTRAINT chk_accesos_oposicion_modo_activo
    CHECK (modo_activo IS NULL OR modo_activo IN ('experto', 'guiado')),
  CONSTRAINT chk_accesos_oposicion_activo_modo
    CHECK (estado <> 'activo' OR modo_activo IS NOT NULL),
  UNIQUE(usuario_id, oposicion_id)
);

CREATE TABLE IF NOT EXISTS acceso_oposicion_modelos (
  id BIGSERIAL,
  acceso_id BIGINT NOT NULL,
  modelo TEXT NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_acceso_oposicion_modelos PRIMARY KEY (id),
  CONSTRAINT fk_acceso_oposicion_modelos_acceso
    FOREIGN KEY (acceso_id)
    REFERENCES accesos_oposicion(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_acceso_oposicion_modelos_modelo
    CHECK (modelo IN ('experto', 'guiado')),
  CONSTRAINT uq_acceso_oposicion_modelos_acceso_modelo
    UNIQUE (acceso_id, modelo)
);

CREATE TABLE IF NOT EXISTS accesos_oposicion_historial (
  id BIGSERIAL,
  acceso_id BIGINT NOT NULL,
  tipo_evento TEXT NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT,
  modo_activo_anterior TEXT,
  modo_activo_nuevo TEXT,
  modelos_anteriores JSONB,
  modelos_nuevos JSONB,
  actor_usuario_id BIGINT,
  motivo TEXT,
  metadata JSONB,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_accesos_oposicion_historial PRIMARY KEY (id),
  CONSTRAINT fk_accesos_oposicion_historial_acceso
    FOREIGN KEY (acceso_id)
    REFERENCES accesos_oposicion(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_accesos_oposicion_historial_actor
    FOREIGN KEY (actor_usuario_id)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_accesos_oposicion_historial_tipo_evento
    CHECK (tipo_evento IN (
      'migracion_legacy', 'creado', 'modelos_actualizados',
      'modo_activo_cambiado', 'vigencia_actualizada', 'expirado',
      'renovado', 'revocado', 'cancelado', 'reactivado',
      'datos_comerciales_modificados'
    ))
);

CREATE TABLE IF NOT EXISTS profesores_oposiciones (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  oposicion_id BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, oposicion_id)
);

CREATE TABLE IF NOT EXISTS progreso_usuario (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tema_id BIGINT REFERENCES temas(id) ON DELETE CASCADE,
  bloque_id BIGINT REFERENCES colecciones(id) ON DELETE CASCADE,
  preguntas_vistas INTEGER NOT NULL DEFAULT 0,
  aciertos INTEGER NOT NULL DEFAULT 0,
  errores INTEGER NOT NULL DEFAULT 0,
  tiempo_medio INTEGER NOT NULL DEFAULT 0,
  UNIQUE (usuario_id, bloque_id)
);

CREATE TABLE IF NOT EXISTS reportes_preguntas (
  id BIGSERIAL PRIMARY KEY,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preguntas_bloque_id ON preguntas(bloque_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_tema_id ON preguntas(tema_id);
CREATE INDEX IF NOT EXISTS idx_preguntas_estado ON preguntas(estado);
CREATE INDEX IF NOT EXISTS idx_preguntas_nivel_dificultad
  ON preguntas(nivel_dificultad) WHERE nivel_dificultad IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_preguntas_es_oficial ON preguntas(es_oficial);
CREATE INDEX IF NOT EXISTS idx_oposiciones_estado ON oposiciones(estado);
CREATE INDEX IF NOT EXISTS idx_oposiciones_categoria ON oposiciones(categoria);
CREATE INDEX IF NOT EXISTS idx_temas_oposicion ON temas(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_tests_usuario_fecha ON tests(usuario_id, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_respuestas_usuario_pregunta ON respuestas_usuario(test_id, pregunta_id);
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_usuario ON accesos_oposicion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_oposicion ON accesos_oposicion(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_activo ON accesos_oposicion(usuario_id, estado) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_historial_acceso_fecha
  ON accesos_oposicion_historial(acceso_id, creado_en DESC, id DESC);

CREATE OR REPLACE FUNCTION public.fn_prevent_accesos_oposicion_historial_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE EXCEPTION 'accesos_oposicion_historial es inmutable';
END;
$function$;

CREATE TRIGGER trg_accesos_oposicion_historial_immutable
  BEFORE UPDATE OR DELETE ON public.accesos_oposicion_historial
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_accesos_oposicion_historial_mutation();

CREATE OR REPLACE FUNCTION public.fn_validate_access_history_system_actor()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  is_stripe_system BOOLEAN;
  stripe_operation TEXT;
BEGIN
  is_stripe_system := NEW.metadata IS NOT NULL
    AND NEW.metadata->>'tipoActor' = 'sistema'
    AND NEW.metadata->>'origen' = 'stripe'
    AND ((SELECT COUNT(*) FROM jsonb_object_keys(NEW.metadata)) = 4
      OR ((SELECT COUNT(*) FROM jsonb_object_keys(NEW.metadata)) = 5 AND NEW.metadata ? 'vigencia'))
    AND btrim(COALESCE(NEW.metadata->>'stripeEventId', '')) <> ''
    AND NEW.metadata->>'operacion' IN ('concesion', 'renovacion');
  stripe_operation := NEW.metadata->>'operacion';

  IF is_stripe_system THEN
    IF NEW.actor_usuario_id IS NOT NULL THEN
      RAISE EXCEPTION 'Los eventos Stripe de sistema requieren actor_usuario_id NULL';
    END IF;
    IF (NEW.tipo_evento = 'creado' AND stripe_operation <> 'concesion')
       OR (NEW.tipo_evento = 'renovado' AND stripe_operation <> 'renovacion') THEN
      RAISE EXCEPTION 'Operación Stripe incompatible con tipo_evento';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.actor_usuario_id IS NULL
     AND NOT (
       (NEW.tipo_evento = 'expirado' AND NEW.metadata IS NOT NULL AND NEW.metadata->>'origen' = 'sistema')
       OR (NEW.tipo_evento = 'migracion_legacy'
        AND NEW.metadata IS NOT NULL
        AND ((NEW.metadata->>'origin' = 'system' AND NEW.metadata->>'process' = 'migration_040')
          OR NEW.metadata->>'origen' = 'baseline'))
     ) THEN
    RAISE EXCEPTION 'actor_usuario_id NULL solo está permitido para eventos de sistema autorizados';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_validate_access_history_system_actor
  BEFORE INSERT OR UPDATE ON public.accesos_oposicion_historial
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_access_history_system_actor();

CREATE INDEX IF NOT EXISTS idx_profesores_oposiciones_user_id ON profesores_oposiciones(user_id);
CREATE INDEX IF NOT EXISTS idx_profesores_oposiciones_oposicion_id ON profesores_oposiciones(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_preguntas(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_pregunta ON reportes_preguntas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado_fecha_id ON reportes_preguntas(estado, fecha_creacion DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso_usuario(usuario_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_progreso_usuario_tema_unique
  ON progreso_usuario(usuario_id, tema_id)
  WHERE tema_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_progreso_usuario_tema ON progreso_usuario(usuario_id, tema_id);
CREATE INDEX IF NOT EXISTS idx_tests_usuario_finalizados ON tests(usuario_id, id) WHERE estado = 'finalizado';

CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'sistema',
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  datos_extra JSONB,
  leida BOOLEAN NOT NULL DEFAULT false,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_fecha
  ON notificaciones(usuario_id, creado_en DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_no_leidas
  ON notificaciones(usuario_id, leida, creado_en DESC, id DESC);

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
CREATE INDEX IF NOT EXISTS idx_tests_tema ON tests(tema_id);
CREATE INDEX IF NOT EXISTS idx_tests_planificacion_usuario
  ON tests(planificacion_id, usuario_id, fecha_creacion DESC)
  WHERE planificacion_id IS NOT NULL;
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_usuarios_oposicion_preferida'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT fk_usuarios_oposicion_preferida
      FOREIGN KEY (oposicion_preferida_id) REFERENCES oposiciones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Etiquetas (migración 016) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS etiquetas (
  id             BIGSERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL UNIQUE,
  color          TEXT,
  descripcion    TEXT,
  creado_por     BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preguntas_etiquetas (
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  etiqueta_id BIGINT NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (pregunta_id, etiqueta_id)
);

CREATE INDEX IF NOT EXISTS idx_etiquetas_nombre   ON etiquetas(nombre);
CREATE INDEX IF NOT EXISTS idx_preg_etiq_pregunta ON preguntas_etiquetas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_preg_etiq_etiqueta ON preguntas_etiquetas(etiqueta_id);

-- ─── Simulacros (migración 017) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulacros (
  id                          BIGSERIAL PRIMARY KEY,
  nombre                      TEXT NOT NULL,
  descripcion                 TEXT,
  oposicion_id                BIGINT REFERENCES oposiciones(id) ON DELETE SET NULL,
  estado                      TEXT NOT NULL DEFAULT 'borrador'
                                CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  tiempo_limite_segundos      INTEGER,
  puntuacion_maxima           NUMERIC(6,2) NOT NULL DEFAULT 100,
  penalizacion                NUMERIC(4,2) NOT NULL DEFAULT 0,
  scope                       TEXT NOT NULL DEFAULT 'experto'
                                CHECK (scope IN ('experto', 'albacer_modulo_final', 'sugerido_profesor')),
  albacer_modulo_id           BIGINT,
  criterio_superacion         TEXT NOT NULL DEFAULT 'nota'
                                CHECK (criterio_superacion IN ('nota', 'porcentaje')),
  valor_superacion            NUMERIC(6,2),
  mostrar_resultados_al_final BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_publicacion           TIMESTAMPTZ,
  creado_por                  BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulacros_bloques (
  id               BIGSERIAL PRIMARY KEY,
  simulacro_id     BIGINT NOT NULL REFERENCES simulacros(id) ON DELETE CASCADE,
  nombre           TEXT NOT NULL,
  orden            SMALLINT NOT NULL DEFAULT 0,
  numero_preguntas INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS simulacros_preguntas (
  id          BIGSERIAL PRIMARY KEY,
  bloque_id   BIGINT NOT NULL REFERENCES simulacros_bloques(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  orden       SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (bloque_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_simulacros_oposicion   ON simulacros(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_simulacros_estado      ON simulacros(estado);
CREATE INDEX IF NOT EXISTS idx_simulacros_creado_por  ON simulacros(creado_por);
CREATE INDEX IF NOT EXISTS idx_sim_bloques_simulacro  ON simulacros_bloques(simulacro_id, orden);
CREATE INDEX IF NOT EXISTS idx_sim_preguntas_bloque   ON simulacros_preguntas(bloque_id, orden);
CREATE INDEX IF NOT EXISTS idx_sim_preguntas_pregunta ON simulacros_preguntas(pregunta_id);

-- ─── Plantillas de test heredadas como admin_tests (migracion 023) ──────────
CREATE TABLE IF NOT EXISTS admin_tests (
  id                    BIGSERIAL PRIMARY KEY,
  nombre                TEXT NOT NULL,
  descripcion           TEXT,
  oposicion_id          BIGINT REFERENCES oposiciones(id) ON DELETE SET NULL,
  tema_id               BIGINT REFERENCES temas(id) ON DELETE SET NULL,
  estado                TEXT NOT NULL DEFAULT 'borrador'
                          CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  nivel_dificultad      VARCHAR(10) CHECK (nivel_dificultad IN ('facil', 'media', 'dificil')),
  duracion_minutos      SMALLINT,
  mezclar_preguntas     BOOLEAN NOT NULL DEFAULT TRUE,
  mostrar_resultados    BOOLEAN NOT NULL DEFAULT TRUE,
  mostrar_explicaciones BOOLEAN NOT NULL DEFAULT TRUE,
  tipo_puntuacion       TEXT NOT NULL DEFAULT 'estandar'
                          CHECK (tipo_puntuacion IN ('estandar', 'personalizada')),
  pts_acierto           NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  pts_fallo             NUMERIC(5,2) NOT NULL DEFAULT -0.25,
  pts_blanco            NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  scope                 TEXT NOT NULL DEFAULT 'experto'
                          CHECK (scope IN ('experto', 'albacer_modulo', 'sugerido_profesor')),
  albacer_modulo_id     BIGINT,
  creado_por            BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  es_demo               BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_tests_demo_unico
  ON admin_tests (oposicion_id) WHERE es_demo = TRUE;

CREATE TABLE IF NOT EXISTS admin_tests_preguntas (
  test_id     BIGINT NOT NULL REFERENCES admin_tests(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  orden       INT NOT NULL DEFAULT 0,
  PRIMARY KEY (test_id, pregunta_id)
);

CREATE TABLE IF NOT EXISTS admin_tests_temas (
  test_id BIGINT NOT NULL REFERENCES admin_tests(id) ON DELETE CASCADE,
  tema_id BIGINT NOT NULL REFERENCES temas(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, tema_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_tests_oposicion ON admin_tests(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_tema ON admin_tests(tema_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_estado ON admin_tests(estado);
CREATE INDEX IF NOT EXISTS idx_admin_tests_creado_por ON admin_tests(creado_por);
CREATE INDEX IF NOT EXISTS idx_admin_tests_preg_test ON admin_tests_preguntas(test_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_preg_preg ON admin_tests_preguntas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_temas_test_id ON admin_tests_temas(test_id);
CREATE INDEX IF NOT EXISTS idx_admin_tests_temas_tema_id ON admin_tests_temas(tema_id);

-- Modo Albacer (migracion 037)
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

CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_tipo_modo
  ON accesos_oposicion(oposicion_id, tipo_alumno, modo_preparacion);
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_ranking_publico
  ON accesos_oposicion(oposicion_id, ranking_publico)
  WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_albacer_modulos_oposicion_orden
  ON albacer_modulos(oposicion_id, orden, id);
CREATE INDEX IF NOT EXISTS idx_albacer_modulos_estado ON albacer_modulos(estado);
CREATE INDEX IF NOT EXISTS idx_albacer_modulo_temas_tema ON albacer_modulo_temas(tema_id);
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
CREATE INDEX IF NOT EXISTS idx_albacer_item_progreso_item_superado
  ON albacer_item_progreso(item_id, superado);
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

DO $$
BEGIN
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_tests_albacer_modulo'
  ) THEN
    ALTER TABLE admin_tests
      ADD CONSTRAINT fk_admin_tests_albacer_modulo
      FOREIGN KEY (albacer_modulo_id)
      REFERENCES albacer_modulos(id)
      ON DELETE SET NULL;
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

-- ─── Planificaciones academicas (migracion 026) ─────────────────────────────
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'tests'::regclass
      AND c.contype = 'f'
      AND a.attname = 'planificacion_id'
  ) THEN
    ALTER TABLE tests
      ADD CONSTRAINT fk_tests_planificacion
      FOREIGN KEY (planificacion_id)
      REFERENCES planificaciones_academicas(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ─── Actividad global (migración 018) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actividad_global (
  id          BIGSERIAL PRIMARY KEY,
  tipo        TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  usuario_id  BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  entidad     TEXT,
  entidad_id  BIGINT,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actividad_fecha   ON actividad_global(fecha DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_actividad_tipo    ON actividad_global(tipo);
CREATE INDEX IF NOT EXISTS idx_actividad_usuario ON actividad_global(usuario_id);

-- Objetos estructurales incorporados por las migraciones 004, 008, 009, 011 y 039.
-- Los datos de configuración y los datos demo permanecen en seed.sql o en el entorno.
CREATE TABLE IF NOT EXISTS suscripciones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada', 'expirada')),
  fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin TIMESTAMP,
  stripe_subscription_id TEXT,
  notas TEXT,
  creada_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizada_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario ON suscripciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_activa
  ON suscripciones(usuario_id, estado) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_fin
  ON suscripciones(fecha_fin) WHERE fecha_fin IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_suscripciones_stripe
  ON suscripciones(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_resets (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  usado_en TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_usuario ON password_resets(usuario_id);

CREATE TABLE IF NOT EXISTS preguntas_marcadas (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
  fecha_marcado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_marcadas_usuario ON preguntas_marcadas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_marcadas_pregunta ON preguntas_marcadas(pregunta_id);

CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave VARCHAR(100) PRIMARY KEY,
  valor TEXT,
  es_secreto BOOLEAN NOT NULL DEFAULT FALSE,
  descripcion VARCHAR(255),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  object_id TEXT,
  livemode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_type_object
  ON stripe_webhook_events(event_type, object_id)
  WHERE object_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON stripe_webhook_events(processed_at);
