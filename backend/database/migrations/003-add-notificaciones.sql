-- Migración 003: Crear tabla de notificaciones de usuario

CREATE TABLE IF NOT EXISTS notificaciones (
  id           SERIAL PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo         VARCHAR(50) NOT NULL,
  titulo       VARCHAR(255) NOT NULL,
  mensaje      TEXT NOT NULL,
  datos_extra  JSONB,
  leida        BOOLEAN NOT NULL DEFAULT false,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id
  ON notificaciones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_notificaciones_leida
  ON notificaciones(usuario_id, leida);
