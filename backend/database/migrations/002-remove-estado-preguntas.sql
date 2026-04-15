-- Migración 002: Eliminar flujo de aprobación de preguntas
-- El campo estado ya no es necesario; todas las preguntas son válidas al crearse.

ALTER TABLE preguntas DROP COLUMN IF EXISTS estado;
DROP INDEX IF EXISTS idx_preguntas_estado;
