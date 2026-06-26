-- Sprint 134 - consentimiento de ranking por usuario + oposicion

ALTER TABLE accesos_oposicion
  ADD COLUMN IF NOT EXISTS ranking_publico BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_accesos_oposicion_ranking_publico
  ON accesos_oposicion(oposicion_id, ranking_publico)
  WHERE estado = 'activo';
