-- Migración 014: añadir categoria y estado a oposiciones
-- categoria: agrupa la oposición por área (p.ej. 'Administración', 'Justicia', 'Fuerzas y Seguridad')
-- estado:    ciclo de vida en el panel admin ('activa' | 'borrador' | 'inactiva')

ALTER TABLE oposiciones
  ADD COLUMN IF NOT EXISTS categoria TEXT;

ALTER TABLE oposiciones
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'borrador', 'inactiva'));

-- Índices para filtrado en listados admin
CREATE INDEX IF NOT EXISTS idx_oposiciones_estado    ON oposiciones(estado);
CREATE INDEX IF NOT EXISTS idx_oposiciones_categoria ON oposiciones(categoria);
