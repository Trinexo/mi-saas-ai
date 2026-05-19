-- Añade columna slug a oposiciones para URLs legibles
ALTER TABLE oposiciones ADD COLUMN IF NOT EXISTS slug VARCHAR(200);

-- Genera slug desde el nombre: minúsculas + acentos normalizados + no-alfanumerico → guion
UPDATE oposiciones
SET slug = LOWER(
  REGEXP_REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    nombre,
    'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),
    'à','a'),'è','e'),'ì','i'),'ò','o'),'ù','u'),
    'ä','a'),'ë','e'),'ï','i'),'ö','o'),'ü','u'),
    'Á','a'),'É','e'),'Í','i'),'Ó','o'),'Ú','u'),
    '[^a-zA-Z0-9]+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Elimina guiones duplicados y extremos
UPDATE oposiciones
SET slug = REGEXP_REPLACE(REGEXP_REPLACE(slug, '-+', '-', 'g'), '^-+|-+$', '', 'g');

-- Si dos oposiciones generan el mismo slug, añade sufijo numérico
UPDATE oposiciones o
SET slug = o.slug || '-' || o.id
WHERE EXISTS (
  SELECT 1 FROM oposiciones o2
  WHERE o2.slug = o.slug AND o2.id < o.id
);

ALTER TABLE oposiciones ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS oposiciones_slug_idx ON oposiciones(slug);
