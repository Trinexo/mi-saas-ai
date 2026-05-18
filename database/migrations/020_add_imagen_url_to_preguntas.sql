-- Migración 020: añadir imagen_url a preguntas
-- Permite adjuntar una imagen WebP al enunciado de cada pregunta.
-- El campo almacena la ruta relativa al servidor, ej: /uploads/preguntas/123.webp

ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS imagen_url TEXT;
