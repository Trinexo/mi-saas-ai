-- Migración 018: log de actividad global para el Dashboard admin
--
-- actividad_global: registra eventos relevantes de la plataforma (nuevos usuarios,
-- tests creados, simulacros publicados, preguntas editadas, etc.)
-- Se inserta desde triggers o desde el backend en los puntos clave.
-- El Dashboard admin consulta los últimos N registros para mostrar "Actividad reciente".

CREATE TABLE IF NOT EXISTS actividad_global (
  id          BIGSERIAL PRIMARY KEY,
  tipo        TEXT NOT NULL,
    -- valores posibles:
    -- 'usuario_registrado' | 'test_creado' | 'test_completado'
    -- 'simulacro_publicado' | 'pregunta_creada' | 'pregunta_editada'
    -- 'comentario_pregunta' | 'reporte_abierto' | 'acceso_concedido'
  descripcion TEXT NOT NULL,            -- texto legible, ej: "Test creado por Juan Pérez"
  usuario_id  BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  entidad     TEXT,                     -- nombre de la entidad relacionada, ej: "Constitución Española - Test 3"
  entidad_id  BIGINT,                   -- id del recurso relacionado (pregunta, test, simulacro…)
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice principal: consulta de los últimos N eventos para el Dashboard
CREATE INDEX IF NOT EXISTS idx_actividad_fecha     ON actividad_global(fecha DESC, id DESC);
-- Índice para filtrar por tipo de evento
CREATE INDEX IF NOT EXISTS idx_actividad_tipo      ON actividad_global(tipo);
-- Índice para filtrar actividad de un usuario concreto
CREATE INDEX IF NOT EXISTS idx_actividad_usuario   ON actividad_global(usuario_id);
