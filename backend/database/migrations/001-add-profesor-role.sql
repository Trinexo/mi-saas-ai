-- Migración: añadir rol 'profesor' y tabla de asignaciones
-- Ejecutar manualmente con: psql -d plataforma_test -f 001-add-profesor-role.sql

-- 1. Ampliar el CHECK constraint del rol en usuarios
--    (si existe un constraint llamado distinto, ajustar el nombre)
DO $$
BEGIN
  -- Intentar eliminar el constraint previo si existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'usuarios'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%role%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE usuarios DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'usuarios'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%role%'
      LIMIT 1
    );
  END IF;
END;
$$;

ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_role_check
  CHECK (role IN ('alumno', 'profesor', 'admin'));

-- 2. Crear tabla de asignación profesor ↔ oposición
CREATE TABLE IF NOT EXISTS profesores_oposiciones (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  oposicion_id INTEGER NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, oposicion_id)
);

CREATE INDEX IF NOT EXISTS idx_profesores_oposiciones_user_id
  ON profesores_oposiciones(user_id);

CREATE INDEX IF NOT EXISTS idx_profesores_oposiciones_oposicion_id
  ON profesores_oposiciones(oposicion_id);
