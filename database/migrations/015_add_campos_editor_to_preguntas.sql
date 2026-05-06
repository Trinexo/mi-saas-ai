-- Migración 015: añadir es_oficial, puntos y tipo_pregunta a preguntas
-- es_oficial:    indica si la pregunta procede de un examen oficial publicado
-- puntos:        puntuación base de la pregunta en un simulacro (default 1.00)
-- tipo_pregunta: tipo de respuesta ('opcion_multiple' | 'verdadero_falso' | 'texto_libre')
--                El MVP solo usa opcion_multiple; los demás se reservan para fases futuras.

ALTER TABLE preguntas
  ADD COLUMN IF NOT EXISTS es_oficial BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE preguntas
  ADD COLUMN IF NOT EXISTS puntos NUMERIC(5,2) NOT NULL DEFAULT 1.00;

ALTER TABLE preguntas
  ADD COLUMN IF NOT EXISTS tipo_pregunta TEXT NOT NULL DEFAULT 'opcion_multiple'
    CHECK (tipo_pregunta IN ('opcion_multiple', 'verdadero_falso', 'texto_libre'));

-- Índice para filtrar preguntas oficiales en el editor admin
CREATE INDEX IF NOT EXISTS idx_preguntas_es_oficial ON preguntas(es_oficial);
