-- Migración 041: eventos Stripe de sistema sin actor humano.
-- actor_usuario_id sigue siendo nullable; la validación se endurece mediante
-- trigger para distinguir eventos de sistema de eventos humanos.

DO $$
DECLARE
  function_definition TEXT;
  function_source TEXT;
  function_oid OID;
  trigger_definition TEXT;
  trigger_type INTEGER;
  trigger_enabled "char";
  trigger_function OID;
BEGIN
  SELECT p.oid, p.prosrc, pg_get_functiondef(p.oid)
    INTO function_oid, function_source, function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'fn_validate_access_history_system_actor'
    AND p.pronargs = 0;

  IF function_definition IS NULL THEN
    CREATE FUNCTION public.fn_validate_access_history_system_actor()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
    DECLARE
      is_stripe_system BOOLEAN;
      stripe_operation TEXT;
    BEGIN
      is_stripe_system := NEW.metadata IS NOT NULL
        AND NEW.metadata->>'tipoActor' = 'sistema'
        AND NEW.metadata->>'origen' = 'stripe'
        AND ((SELECT COUNT(*) FROM jsonb_object_keys(NEW.metadata)) = 4
          OR ((SELECT COUNT(*) FROM jsonb_object_keys(NEW.metadata)) = 5 AND NEW.metadata ? 'vigencia'))
        AND btrim(COALESCE(NEW.metadata->>'stripeEventId', '')) <> ''
        AND NEW.metadata->>'operacion' IN ('concesion', 'renovacion');
      stripe_operation := NEW.metadata->>'operacion';

      IF is_stripe_system THEN
        IF NEW.actor_usuario_id IS NOT NULL THEN
          RAISE EXCEPTION 'Los eventos Stripe de sistema requieren actor_usuario_id NULL';
        END IF;
        IF (NEW.tipo_evento = 'creado' AND stripe_operation <> 'concesion')
           OR (NEW.tipo_evento = 'renovado' AND stripe_operation <> 'renovacion') THEN
          RAISE EXCEPTION 'Operación Stripe incompatible con tipo_evento';
        END IF;
        RETURN NEW;
      END IF;

      IF NEW.actor_usuario_id IS NULL
         AND NOT (
           (NEW.tipo_evento = 'expirado'
            AND NEW.metadata IS NOT NULL
            AND NEW.metadata->>'origen' = 'sistema')
           OR (NEW.tipo_evento = 'migracion_legacy'
            AND NEW.metadata IS NOT NULL
            AND ((NEW.metadata->>'origin' = 'system' AND NEW.metadata->>'process' = 'migration_040')
              OR NEW.metadata->>'origen' = 'baseline'))
         ) THEN
        RAISE EXCEPTION 'actor_usuario_id NULL solo está permitido para eventos de sistema autorizados';
      END IF;

      RETURN NEW;
    END;
    $function$;
  ELSE
    IF function_definition !~* 'fn_validate_access_history_system_actor'
       OR function_definition !~* 'tipoActor'
       OR function_definition !~* 'stripeEventId'
       OR function_definition !~* 'actor_usuario_id IS NULL' THEN
      RAISE EXCEPTION 'Estructura incompatible: fn_validate_access_history_system_actor';
    END IF;
  END IF;

  SELECT pg_get_triggerdef(t.oid), t.tgtype, t.tgenabled, t.tgfoid
    INTO trigger_definition, trigger_type, trigger_enabled, trigger_function
  FROM pg_trigger t
  WHERE t.tgrelid = 'public.accesos_oposicion_historial'::regclass
    AND t.tgname = 'trg_validate_access_history_system_actor'
    AND NOT t.tgisinternal;

  IF trigger_definition IS NULL THEN
    CREATE TRIGGER trg_validate_access_history_system_actor
      BEFORE INSERT OR UPDATE ON public.accesos_oposicion_historial
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_validate_access_history_system_actor();
  ELSIF trigger_enabled <> 'O'
     OR trigger_function <> function_oid
     OR (trigger_type & 2) <> 2
     OR (trigger_type & 4) <> 4
     OR (trigger_type & 16) <> 16
     OR (trigger_type & (8 + 32)) <> 0
     OR trigger_definition !~* 'ON public\.accesos_oposicion_historial' THEN
    RAISE EXCEPTION 'Estructura incompatible: trg_validate_access_history_system_actor';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.accesos_oposicion_historial h
    WHERE h.actor_usuario_id IS NULL
      AND NOT (
        (h.tipo_evento IN ('creado', 'renovado')
         AND h.metadata IS NOT NULL
         AND h.metadata->>'tipoActor' = 'sistema'
         AND h.metadata->>'origen' = 'stripe'
         AND ((SELECT COUNT(*) FROM jsonb_object_keys(h.metadata)) = 4
           OR ((SELECT COUNT(*) FROM jsonb_object_keys(h.metadata)) = 5 AND h.metadata ? 'vigencia'))
         AND btrim(COALESCE(h.metadata->>'stripeEventId', '')) <> ''
         AND ((h.tipo_evento = 'creado' AND h.metadata->>'operacion' = 'concesion')
           OR (h.tipo_evento = 'renovado' AND h.metadata->>'operacion' = 'renovacion')))
        OR (h.tipo_evento = 'expirado'
         AND h.metadata IS NOT NULL
         AND h.metadata->>'origen' = 'sistema')
        OR (h.tipo_evento = 'migracion_legacy'
         AND h.metadata IS NOT NULL
         AND ((h.metadata->>'origin' = 'system' AND h.metadata->>'process' = 'migration_040')
           OR h.metadata->>'origen' = 'baseline'))
      )
  ) THEN
    RAISE EXCEPTION 'Datos incompatibles: actor_usuario_id NULL no autorizado';
  END IF;
END $$;
