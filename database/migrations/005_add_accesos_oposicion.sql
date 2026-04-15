-- Migración 005: accesos a cursos de test por oposición
-- Un usuario puede comprar acceso al banco de preguntas de una oposición concreta.
-- La dimensión de "acceso al contenido" es independiente del plan (pro/elite) que controla funcionalidades.

CREATE TABLE IF NOT EXISTS accesos_oposicion (
  id            BIGSERIAL PRIMARY KEY,
  usuario_id    BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  oposicion_id  BIGINT NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
  estado        TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'expirado', 'cancelado')),
  fecha_inicio  TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_fin     TIMESTAMP,                        -- NULL = acceso indefinido
  precio_pagado NUMERIC(8,2),                     -- registro histórico, sin pasarela aún
  notas         TEXT,                             -- referencia interna (nº pedido, etc.)
  creada_en     TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizada_en TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id, oposicion_id)
);

CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_usuario ON accesos_oposicion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_oposicion ON accesos_oposicion(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_activo ON accesos_oposicion(usuario_id, estado) WHERE estado = 'activo';
