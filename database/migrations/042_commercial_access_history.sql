-- Migración 042: historial canónico de cambios comerciales de accesos.
-- No transforma filas existentes; únicamente amplía el catálogo de eventos.

DO $$
DECLARE
  constraint_oid OID;
  definition TEXT;
  actual TEXT[];
  expected CONSTANT TEXT[] := ARRAY[
    'cancelado', 'creado', 'datos_comerciales_modificados', 'expirado',
    'migracion_legacy', 'modo_activo_cambiado', 'modelos_actualizados',
    'reactivado', 'renovado', 'revocado', 'vigencia_actualizada'
  ];
BEGIN
  SELECT c.oid, pg_get_constraintdef(c.oid)
    INTO constraint_oid, definition
  FROM pg_constraint c
  WHERE c.conrelid = 'public.accesos_oposicion_historial'::regclass
    AND c.conname = 'chk_accesos_oposicion_historial_tipo_evento'
    AND c.contype = 'c';

  IF constraint_oid IS NOT NULL THEN
    SELECT COALESCE(array_agg(match[1] ORDER BY match[1]), ARRAY[]::TEXT[])
      INTO actual
    FROM regexp_matches(definition, '''([^'']+)''', 'g') AS match;
    IF actual = expected THEN
      RETURN;
    END IF;
    IF EXISTS (SELECT 1 FROM unnest(actual) item WHERE NOT (item = ANY(expected)))
       OR EXISTS (
         SELECT 1
         FROM unnest(expected) item
         WHERE item <> 'datos_comerciales_modificados'
           AND NOT (item = ANY(actual))
       ) THEN
      RAISE EXCEPTION 'Estructura incompatible: chk_accesos_oposicion_historial_tipo_evento';
    END IF;
    IF NOT (definition ~* 'tipo_evento')
       OR NOT (definition ~* 'migracion_legacy')
       OR NOT (definition ~* 'reactivado') THEN
      RAISE EXCEPTION 'Estructura incompatible: chk_accesos_oposicion_historial_tipo_evento';
    END IF;
    EXECUTE 'ALTER TABLE public.accesos_oposicion_historial DROP CONSTRAINT chk_accesos_oposicion_historial_tipo_evento';
  END IF;

  ALTER TABLE public.accesos_oposicion_historial
    ADD CONSTRAINT chk_accesos_oposicion_historial_tipo_evento
    CHECK (tipo_evento IN (
      'migracion_legacy', 'creado', 'modelos_actualizados',
      'modo_activo_cambiado', 'vigencia_actualizada', 'expirado',
      'renovado', 'revocado', 'cancelado', 'reactivado',
      'datos_comerciales_modificados'
    ));
END $$;
