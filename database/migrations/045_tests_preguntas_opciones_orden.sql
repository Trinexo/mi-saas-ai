-- Orden de opciones congelado por intento. Los tests anteriores a 045 usan
-- el orden canónico de opciones_respuesta.id mediante fallback en las lecturas.
ALTER TABLE tests_preguntas
  ADD COLUMN IF NOT EXISTS opciones_orden BIGINT[];
