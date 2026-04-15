-- Migración 010: tiempo límite por defecto en oposiciones
-- Permite configurar desde admin el tiempo estándar del examen oficial.
-- NULL = sin límite por defecto (el usuario puede introducir uno manual).

ALTER TABLE oposiciones
  ADD COLUMN IF NOT EXISTS tiempo_limite_minutos INT CHECK (tiempo_limite_minutos > 0 AND tiempo_limite_minutos <= 600);
