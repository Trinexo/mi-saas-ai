-- Migracion 040: contexto de acceso, modelos incluidos e historial inmutable.
-- No cambia los tipos temporales existentes.

-- 1) La columna se incorpora nullable; la constraint de coherencia se anade
-- despues del backfill para no dejar una ventana de datos invalidos.
DO $$
DECLARE
  column_type TEXT;
  is_nullable TEXT;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod),
         CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END
    INTO column_type, is_nullable
  FROM pg_attribute a
  WHERE a.attrelid = 'public.accesos_oposicion'::regclass
    AND a.attname = 'modo_activo'
    AND NOT a.attisdropped;

  IF column_type IS NULL THEN
    ALTER TABLE public.accesos_oposicion ADD COLUMN modo_activo TEXT;
  ELSIF column_type <> 'text' OR is_nullable <> 'YES' THEN
    RAISE EXCEPTION 'Estructura incompatible: accesos_oposicion.modo_activo';
  END IF;
END $$;

-- 2) Sustituir el CHECK legacy de estado solo despues de localizarlo y
-- verificar que contiene exactamente el contrato legacy esperado.
DO $$
DECLARE
  legacy_name TEXT;
  legacy_def TEXT;
  current_def TEXT;
  legacy_count INTEGER;
  estado_attnum SMALLINT;
  current_literals TEXT[];
  legacy_literals TEXT[];
BEGIN
  SELECT pg_get_constraintdef(c.oid)
    INTO current_def
  FROM pg_constraint c
  WHERE c.conrelid = 'public.accesos_oposicion'::regclass
    AND c.conname = 'chk_accesos_oposicion_estado_fase1';

  IF current_def IS NOT NULL THEN
    SELECT array_agg(parts[1] ORDER BY ordinal)
      INTO current_literals
    FROM regexp_matches(current_def, '''([^'']+)''', 'g') WITH ORDINALITY AS matches(parts, ordinal);
    IF current_literals IS DISTINCT FROM ARRAY['pendiente_modo', 'activo', 'expirado', 'revocado', 'cancelado']::TEXT[] THEN
      RAISE EXCEPTION 'Estructura incompatible: chk_accesos_oposicion_estado_fase1';
    END IF;
  END IF;

  SELECT attnum INTO estado_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.accesos_oposicion'::regclass
    AND attname = 'estado'
    AND NOT attisdropped;

  SELECT COUNT(*)::INTEGER
    INTO legacy_count
  FROM pg_constraint c
  WHERE c.conrelid = 'public.accesos_oposicion'::regclass
    AND c.contype = 'c'
    AND c.conkey = ARRAY[estado_attnum]
    AND pg_get_constraintdef(c.oid) ~* 'estado'
    AND pg_get_constraintdef(c.oid) ~* 'activo'
    AND pg_get_constraintdef(c.oid) ~* 'expirado'
    AND pg_get_constraintdef(c.oid) ~* 'cancelado'
    AND pg_get_constraintdef(c.oid) !~* 'pendiente_modo'
    AND pg_get_constraintdef(c.oid) !~* 'revocado';

  IF current_def IS NULL AND legacy_count <> 1 THEN
    IF legacy_count = 0 THEN
      RAISE EXCEPTION 'No se encontro el CHECK legacy de estado esperado';
    END IF;
    RAISE EXCEPTION 'Se encontraron % CHECK legacy de estado; se requiere exactamente uno', legacy_count;
  END IF;

  IF current_def IS NOT NULL
     AND (current_def !~* 'pendiente_modo'
       OR current_def !~* 'activo'
       OR current_def !~* 'expirado'
       OR current_def !~* 'revocado'
       OR current_def !~* 'cancelado') THEN
    RAISE EXCEPTION 'Estructura incompatible: chk_accesos_oposicion_estado_fase1';
  END IF;

  IF current_def IS NOT NULL THEN
    IF legacy_count <> 0 THEN
      RAISE EXCEPTION 'Coexisten el CHECK de Fase 1 y un CHECK legacy de estado';
    END IF;
    RETURN;
  END IF;

  SELECT c.conname, pg_get_constraintdef(c.oid)
    INTO legacy_name, legacy_def
  FROM pg_constraint c
  WHERE c.conrelid = 'public.accesos_oposicion'::regclass
    AND c.contype = 'c'
    AND c.conkey = ARRAY[estado_attnum]
    AND pg_get_constraintdef(c.oid) ~* 'estado'
    AND pg_get_constraintdef(c.oid) ~* 'activo'
    AND pg_get_constraintdef(c.oid) ~* 'expirado'
    AND pg_get_constraintdef(c.oid) ~* 'cancelado'
    AND pg_get_constraintdef(c.oid) !~* 'pendiente_modo'
    AND pg_get_constraintdef(c.oid) !~* 'revocado';

  SELECT array_agg(parts[1] ORDER BY ordinal)
    INTO legacy_literals
  FROM regexp_matches(legacy_def, '''([^'']+)''', 'g') WITH ORDINALITY AS matches(parts, ordinal);

  IF legacy_literals IS DISTINCT FROM ARRAY['activo', 'expirado', 'cancelado']::TEXT[] THEN
    RAISE EXCEPTION 'Definicion incompatible para el CHECK legacy de estado';
  END IF;

  EXECUTE format(
    'ALTER TABLE public.accesos_oposicion DROP CONSTRAINT %I',
    legacy_name
  );

  ALTER TABLE public.accesos_oposicion
    ADD CONSTRAINT chk_accesos_oposicion_estado_fase1
    CHECK (estado IN ('pendiente_modo', 'activo', 'expirado', 'revocado', 'cancelado'));
END $$;

-- 3) Constraint del dominio del modo activo.
DO $$
DECLARE
  definition TEXT;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
    INTO definition
  FROM pg_constraint c
  WHERE c.conrelid = 'public.accesos_oposicion'::regclass
    AND c.conname = 'chk_accesos_oposicion_modo_activo';

  IF definition IS NULL THEN
    ALTER TABLE public.accesos_oposicion
      ADD CONSTRAINT chk_accesos_oposicion_modo_activo
      CHECK (modo_activo IS NULL OR modo_activo IN ('experto', 'guiado'));
  ELSIF definition !~* 'modo_activo'
     OR definition !~* 'experto'
     OR definition !~* 'guiado' THEN
    RAISE EXCEPTION 'Estructura incompatible: chk_accesos_oposicion_modo_activo';
  END IF;
END $$;

-- 4) Tabla de modelos incluidos.
DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
BEGIN
  SELECT to_regclass('public.acceso_oposicion_modelos') IS NOT NULL INTO table_exists;
  IF NOT table_exists THEN
    CREATE TABLE public.acceso_oposicion_modelos (
      id BIGSERIAL,
      acceso_id BIGINT NOT NULL,
      modelo TEXT NOT NULL,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT pk_acceso_oposicion_modelos PRIMARY KEY (id),
      CONSTRAINT fk_acceso_oposicion_modelos_acceso
        FOREIGN KEY (acceso_id)
        REFERENCES public.accesos_oposicion(id)
        ON DELETE CASCADE,
      CONSTRAINT chk_acceso_oposicion_modelos_modelo
        CHECK (modelo IN ('experto', 'guiado')),
      CONSTRAINT uq_acceso_oposicion_modelos_acceso_modelo
        UNIQUE (acceso_id, modelo)
    );
  ELSE
    SELECT COUNT(*)::INTEGER INTO column_count
    FROM pg_attribute a
    WHERE a.attrelid = 'public.acceso_oposicion_modelos'::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped;

    IF column_count <> 4
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'id' AND atttypid = 'int8'::regtype AND attnotnull)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'acceso_id' AND atttypid = 'int8'::regtype AND attnotnull)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'modelo' AND atttypid = 'text'::regtype AND attnotnull)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'creado_en' AND atttypid = 'timestamp'::regtype AND attnotnull) THEN
      RAISE EXCEPTION 'Estructura incompatible: acceso_oposicion_modelos';
    END IF;
  END IF;
END $$;

-- 4b) Las estructuras preexistentes deben tener tambien las constraints y
-- FKs exactas; no basta con que las columnas coincidan.
DO $$
DECLARE
  definition TEXT;
  delete_action "char";
BEGIN
  SELECT pg_get_constraintdef(oid) INTO definition
  FROM pg_constraint
  WHERE conrelid = 'public.acceso_oposicion_modelos'::regclass
    AND conname = 'pk_acceso_oposicion_modelos'
    AND contype = 'p'
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'id' AND NOT attisdropped)];
  IF definition IS NULL THEN
    RAISE EXCEPTION 'Estructura incompatible: pk_acceso_oposicion_modelos';
  END IF;

  SELECT pg_get_constraintdef(oid) INTO definition
  FROM pg_constraint
  WHERE conrelid = 'public.acceso_oposicion_modelos'::regclass
    AND conname = 'chk_acceso_oposicion_modelos_modelo'
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'modelo' AND NOT attisdropped)];
  IF definition IS NULL OR definition !~* 'modelo' OR definition !~* 'experto' OR definition !~* 'guiado' THEN
    RAISE EXCEPTION 'Estructura incompatible: chk_acceso_oposicion_modelos_modelo';
  END IF;

  SELECT pg_get_constraintdef(oid) INTO definition
  FROM pg_constraint
  WHERE conrelid = 'public.acceso_oposicion_modelos'::regclass
    AND conname = 'uq_acceso_oposicion_modelos_acceso_modelo'
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'acceso_id' AND NOT attisdropped),
      (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'modelo' AND NOT attisdropped)
    ];
  IF definition IS NULL OR definition !~* 'acceso_id' OR definition !~* 'modelo' THEN
    RAISE EXCEPTION 'Estructura incompatible: uq_acceso_oposicion_modelos_acceso_modelo';
  END IF;

  SELECT pg_get_constraintdef(oid), confdeltype
    INTO definition, delete_action
  FROM pg_constraint
  WHERE conrelid = 'public.acceso_oposicion_modelos'::regclass
    AND conname = 'fk_acceso_oposicion_modelos_acceso'
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.acceso_oposicion_modelos'::regclass AND attname = 'acceso_id' AND NOT attisdropped)]
    AND confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion'::regclass AND attname = 'id' AND NOT attisdropped)]
    AND confrelid = 'public.accesos_oposicion'::regclass;
  IF definition IS NULL OR delete_action <> 'c' THEN
    RAISE EXCEPTION 'Estructura incompatible: fk_acceso_oposicion_modelos_acceso';
  END IF;
END $$;

-- 5) Tabla de historial.
DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
BEGIN
  SELECT to_regclass('public.accesos_oposicion_historial') IS NOT NULL INTO table_exists;
  IF NOT table_exists THEN
    CREATE TABLE public.accesos_oposicion_historial (
      id BIGSERIAL,
      acceso_id BIGINT NOT NULL,
      tipo_evento TEXT NOT NULL,
      estado_anterior TEXT,
      estado_nuevo TEXT,
      modo_activo_anterior TEXT,
      modo_activo_nuevo TEXT,
      modelos_anteriores JSONB,
      modelos_nuevos JSONB,
      actor_usuario_id BIGINT,
      motivo TEXT,
      metadata JSONB,
      creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT pk_accesos_oposicion_historial PRIMARY KEY (id),
      CONSTRAINT fk_accesos_oposicion_historial_acceso
        FOREIGN KEY (acceso_id)
        REFERENCES public.accesos_oposicion(id)
        ON DELETE RESTRICT,
      CONSTRAINT fk_accesos_oposicion_historial_actor
        FOREIGN KEY (actor_usuario_id)
        REFERENCES public.usuarios(id)
        ON DELETE RESTRICT,
      CONSTRAINT chk_accesos_oposicion_historial_tipo_evento
        CHECK (tipo_evento IN (
          'migracion_legacy', 'creado', 'modelos_actualizados',
          'modo_activo_cambiado', 'vigencia_actualizada', 'expirado',
          'renovado', 'revocado', 'cancelado', 'reactivado'
        ))
    );
  ELSE
    SELECT COUNT(*)::INTEGER INTO column_count
    FROM pg_attribute a
    WHERE a.attrelid = 'public.accesos_oposicion_historial'::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped;

    IF column_count <> 13
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'id' AND atttypid = 'int8'::regtype AND attnotnull)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'acceso_id' AND atttypid = 'int8'::regtype AND attnotnull)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'tipo_evento' AND atttypid = 'text'::regtype AND attnotnull)
       OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'creado_en' AND atttypid = 'timestamp'::regtype AND attnotnull) THEN
      RAISE EXCEPTION 'Estructura incompatible: accesos_oposicion_historial';
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  definition TEXT;
  delete_action "char";
BEGIN
  SELECT pg_get_constraintdef(oid) INTO definition
  FROM pg_constraint
  WHERE conrelid = 'public.accesos_oposicion_historial'::regclass
    AND conname = 'pk_accesos_oposicion_historial'
    AND contype = 'p'
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'id' AND NOT attisdropped)];
  IF definition IS NULL THEN
    RAISE EXCEPTION 'Estructura incompatible: pk_accesos_oposicion_historial';
  END IF;

  SELECT pg_get_constraintdef(oid) INTO definition
  FROM pg_constraint
  WHERE conrelid = 'public.accesos_oposicion_historial'::regclass
    AND conname = 'chk_accesos_oposicion_historial_tipo_evento'
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'tipo_evento' AND NOT attisdropped)];
  IF definition IS NULL
     OR definition !~* 'migracion_legacy'
     OR definition !~* 'renovado'
     OR definition !~* 'reactivado'
     OR definition !~* 'cancelado' THEN
    RAISE EXCEPTION 'Estructura incompatible: chk_accesos_oposicion_historial_tipo_evento';
  END IF;

  SELECT pg_get_constraintdef(oid), confdeltype
    INTO definition, delete_action
  FROM pg_constraint
  WHERE conrelid = 'public.accesos_oposicion_historial'::regclass
    AND conname = 'fk_accesos_oposicion_historial_acceso'
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'acceso_id' AND NOT attisdropped)]
    AND confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion'::regclass AND attname = 'id' AND NOT attisdropped)]
    AND confrelid = 'public.accesos_oposicion'::regclass;
  IF definition IS NULL OR delete_action <> 'r' THEN
    RAISE EXCEPTION 'Estructura incompatible: fk_accesos_oposicion_historial_acceso';
  END IF;

  SELECT pg_get_constraintdef(oid), confdeltype
    INTO definition, delete_action
  FROM pg_constraint
  WHERE conrelid = 'public.accesos_oposicion_historial'::regclass
    AND conname = 'fk_accesos_oposicion_historial_actor'
    AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'actor_usuario_id' AND NOT attisdropped)]
    AND confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.usuarios'::regclass AND attname = 'id' AND NOT attisdropped)]
    AND confrelid = 'public.usuarios'::regclass;
  IF definition IS NULL OR delete_action <> 'r' THEN
    RAISE EXCEPTION 'Estructura incompatible: fk_accesos_oposicion_historial_actor';
  END IF;
END $$;

-- 5a) Las tablas preexistentes deben coincidir columna por columna. No se
-- completa una tabla parcialmente compatible.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      VALUES
        ('acceso_oposicion_modelos', 'id', 'bigint', 'NO', 'sequence'),
        ('acceso_oposicion_modelos', 'acceso_id', 'bigint', 'NO', 'none'),
        ('acceso_oposicion_modelos', 'modelo', 'text', 'NO', 'none'),
        ('acceso_oposicion_modelos', 'creado_en', 'timestamp without time zone', 'NO', 'now'),
        ('accesos_oposicion_historial', 'id', 'bigint', 'NO', 'sequence'),
        ('accesos_oposicion_historial', 'acceso_id', 'bigint', 'NO', 'none'),
        ('accesos_oposicion_historial', 'tipo_evento', 'text', 'NO', 'none'),
        ('accesos_oposicion_historial', 'estado_anterior', 'text', 'YES', 'none'),
        ('accesos_oposicion_historial', 'estado_nuevo', 'text', 'YES', 'none'),
        ('accesos_oposicion_historial', 'modo_activo_anterior', 'text', 'YES', 'none'),
        ('accesos_oposicion_historial', 'modo_activo_nuevo', 'text', 'YES', 'none'),
        ('accesos_oposicion_historial', 'modelos_anteriores', 'jsonb', 'YES', 'none'),
        ('accesos_oposicion_historial', 'modelos_nuevos', 'jsonb', 'YES', 'none'),
        ('accesos_oposicion_historial', 'actor_usuario_id', 'bigint', 'YES', 'none'),
        ('accesos_oposicion_historial', 'motivo', 'text', 'YES', 'none'),
        ('accesos_oposicion_historial', 'metadata', 'jsonb', 'YES', 'none'),
        ('accesos_oposicion_historial', 'creado_en', 'timestamp without time zone', 'NO', 'now')
    ) AS expected(table_name, column_name, data_type, is_nullable, default_kind)
    LEFT JOIN information_schema.columns c
      ON c.table_schema = 'public'
     AND c.table_name = expected.table_name
     AND c.column_name = expected.column_name
    WHERE c.column_name IS NULL
       OR c.data_type <> expected.data_type
       OR c.is_nullable <> expected.is_nullable
       OR (expected.default_kind = 'none' AND c.column_default IS NOT NULL)
       OR (expected.default_kind = 'sequence' AND (c.column_default IS NULL OR c.column_default !~* 'nextval\('))
       OR (expected.default_kind = 'now' AND (c.column_default IS NULL OR (c.column_default !~* '^now\(\)' AND c.column_default !~* 'CURRENT_TIMESTAMP')))
  )
  OR (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acceso_oposicion_modelos') <> 4
   OR (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accesos_oposicion_historial') <> 13 THEN
    RAISE EXCEPTION 'Estructura incompatible: columnas o defaults de tablas Fase 1';
  END IF;
END $$;

-- 6) Backfill determinista y sin concesion de un segundo modelo.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.accesos_oposicion
    WHERE modo_preparacion IS NULL
       OR modo_preparacion NOT IN ('experto', 'albacer')
  ) THEN
    RAISE EXCEPTION 'Datos legacy invalidos en accesos_oposicion.modo_preparacion';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.accesos_oposicion'::regclass
      AND attname = 'modo_preparacion'
      AND NOT attnotnull
  ) THEN
    RAISE EXCEPTION 'Estructura incompatible: accesos_oposicion.modo_preparacion debe ser NOT NULL';
  END IF;
END $$;

UPDATE public.accesos_oposicion
SET modo_activo = CASE
  WHEN modo_preparacion = 'experto' THEN 'experto'
  WHEN modo_preparacion = 'albacer' THEN 'guiado'
  ELSE NULL
END
WHERE modo_activo IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.accesos_oposicion
    WHERE (modo_preparacion = 'experto' AND modo_activo IS DISTINCT FROM 'experto')
       OR (modo_preparacion = 'albacer' AND modo_activo IS DISTINCT FROM 'guiado')
  ) THEN
    RAISE EXCEPTION 'modo_activo incompatible con modo_preparacion legacy';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.acceso_oposicion_modelos m
    GROUP BY m.acceso_id
    HAVING COUNT(*) <> 1
  ) THEN
    RAISE EXCEPTION 'Modelos preexistentes incompatibles con el backfill legacy';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.acceso_oposicion_modelos m
    JOIN public.accesos_oposicion a ON a.id = m.acceso_id
    WHERE (a.modo_preparacion = 'experto' AND m.modelo <> 'experto')
       OR (a.modo_preparacion = 'albacer' AND m.modelo <> 'guiado')
  ) THEN
    RAISE EXCEPTION 'Modelos preexistentes no coinciden con modo_preparacion';
  END IF;
END $$;

INSERT INTO public.acceso_oposicion_modelos (acceso_id, modelo)
SELECT id,
       CASE
         WHEN modo_preparacion = 'experto' THEN 'experto'
         WHEN modo_preparacion = 'albacer' THEN 'guiado'
         ELSE NULL
       END
FROM public.accesos_oposicion
ON CONFLICT (acceso_id, modelo) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.accesos_oposicion a
    LEFT JOIN public.acceso_oposicion_modelos m ON m.acceso_id = a.id
    GROUP BY a.id
    HAVING COUNT(m.id) <> 1
  ) THEN
    RAISE EXCEPTION 'El backfill no produjo exactamente un modelo por acceso';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.accesos_oposicion a
    JOIN public.acceso_oposicion_modelos m ON m.acceso_id = a.id
    WHERE a.modo_activo <> m.modelo
  ) THEN
    RAISE EXCEPTION 'modo_activo no coincide con el modelo legacy';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.accesos_oposicion_historial h
    JOIN public.accesos_oposicion a ON a.id = h.acceso_id
    WHERE h.tipo_evento = 'migracion_legacy'
    GROUP BY h.acceso_id
    HAVING COUNT(*) <> 1
  ) THEN
    RAISE EXCEPTION 'Hay mas de un evento migracion_legacy por acceso';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.accesos_oposicion_historial h
    JOIN public.accesos_oposicion a ON a.id = h.acceso_id
    JOIN public.acceso_oposicion_modelos m
      ON m.acceso_id = a.id AND m.modelo = a.modo_activo
    WHERE h.tipo_evento = 'migracion_legacy'
      AND (
        h.estado_anterior IS DISTINCT FROM a.estado
        OR h.estado_nuevo IS DISTINCT FROM a.estado
        OR h.modo_activo_anterior IS NOT NULL
        OR h.modo_activo_nuevo IS DISTINCT FROM a.modo_activo
        OR h.modelos_anteriores IS DISTINCT FROM '[]'::jsonb
        OR h.modelos_nuevos IS DISTINCT FROM jsonb_build_array(m.modelo)
        OR h.actor_usuario_id IS NOT NULL
        OR h.motivo IS NOT NULL
        OR h.metadata IS DISTINCT FROM jsonb_build_object('origin', 'system', 'process', 'migration_040')
      )
  ) THEN
    RAISE EXCEPTION 'Payload incompatible en evento migracion_legacy preexistente';
  END IF;
END $$;

INSERT INTO public.accesos_oposicion_historial (
  acceso_id, tipo_evento, estado_anterior, estado_nuevo,
  modo_activo_anterior, modo_activo_nuevo,
  modelos_anteriores, modelos_nuevos, actor_usuario_id, motivo, metadata
)
SELECT a.id, 'migracion_legacy', a.estado, a.estado,
       NULL, a.modo_activo,
       '[]'::jsonb, jsonb_build_array(m.modelo), NULL, NULL,
       jsonb_build_object('origin', 'system', 'process', 'migration_040')
FROM public.accesos_oposicion a
JOIN public.acceso_oposicion_modelos m ON m.acceso_id = a.id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.accesos_oposicion_historial h
  WHERE h.acceso_id = a.id
    AND h.tipo_evento = 'migracion_legacy'
);

-- 7) Coherencia de acceso activo despues del backfill.
DO $$
DECLARE
  definition TEXT;
BEGIN
  SELECT pg_get_constraintdef(c.oid)
    INTO definition
  FROM pg_constraint c
  WHERE c.conrelid = 'public.accesos_oposicion'::regclass
    AND c.conname = 'chk_accesos_oposicion_activo_modo';

  IF definition IS NULL THEN
    ALTER TABLE public.accesos_oposicion
      ADD CONSTRAINT chk_accesos_oposicion_activo_modo
      CHECK (estado <> 'activo' OR modo_activo IS NOT NULL);
  ELSIF definition !~* 'estado' OR definition !~* 'modo_activo' THEN
    RAISE EXCEPTION 'Estructura incompatible: chk_accesos_oposicion_activo_modo';
  END IF;
END $$;

-- 8) Indice de historial. El UNIQUE de modelos ya crea su indice.
DO $$
DECLARE
  definition TEXT;
  index_oid OID;
  index_method TEXT;
  is_unique BOOLEAN;
  is_partial BOOLEAN;
  key_count INTEGER;
  total_count INTEGER;
  key_columns SMALLINT[];
  key_options SMALLINT[];
BEGIN
  SELECT i.indexrelid, am.amname, i.indisunique, i.indpred IS NOT NULL,
         i.indnkeyatts, i.indnatts, i.indkey::smallint[], i.indoption::smallint[],
         pg_get_indexdef(i.indexrelid)
    INTO index_oid, index_method, is_unique, is_partial,
         key_count, total_count, key_columns, key_options, definition
  FROM pg_index i
  JOIN pg_class ic ON ic.oid = i.indexrelid
  JOIN pg_namespace n ON n.oid = ic.relnamespace
  JOIN pg_am am ON am.oid = ic.relam
  WHERE n.nspname = 'public'
    AND ic.relname = 'idx_accesos_oposicion_historial_acceso_fecha';

  IF index_oid IS NULL THEN
    CREATE INDEX idx_accesos_oposicion_historial_acceso_fecha
      ON public.accesos_oposicion_historial(acceso_id, creado_en DESC, id DESC);
  ELSIF index_method <> 'btree'
     OR is_unique
     OR is_partial
     OR key_count <> 3
     OR total_count <> 3
     OR ARRAY[key_columns[0], key_columns[1], key_columns[2]] <> ARRAY[
       (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'acceso_id' AND NOT attisdropped),
       (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'creado_en' AND NOT attisdropped),
       (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.accesos_oposicion_historial'::regclass AND attname = 'id' AND NOT attisdropped)
     ]
     OR key_options[0] <> 0
     OR key_options[1] <> 3
     OR key_options[2] <> 3
     OR definition !~* 'ON public\.accesos_oposicion_historial USING btree' THEN
    RAISE EXCEPTION 'Estructura incompatible: idx_accesos_oposicion_historial_acceso_fecha';
  END IF;
END $$;

-- 9) Historial inmutable a nivel de base. Los permisos PostgreSQL se
-- endureceran en una PR posterior.
DO $$
DECLARE
  function_definition TEXT;
  function_source TEXT;
  function_oid OID;
  function_return OID;
  function_language OID;
  trigger_definition TEXT;
  trigger_type INTEGER;
  trigger_enabled "char";
  trigger_function OID;
BEGIN
  SELECT p.oid, p.prorettype, p.prolang, p.prosrc, pg_get_functiondef(p.oid)
    INTO function_oid, function_return, function_language, function_source, function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'fn_prevent_accesos_oposicion_historial_mutation'
    AND p.pronargs = 0;

  IF function_definition IS NULL THEN
    CREATE FUNCTION public.fn_prevent_accesos_oposicion_historial_mutation()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $function$
    BEGIN
      RAISE EXCEPTION 'accesos_oposicion_historial es inmutable';
    END;
    $function$;
  ELSIF function_return <> 'trigger'::regtype
     OR function_language <> (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
     OR lower(btrim(regexp_replace(function_source, '\s+', ' ', 'g'))) <> 'begin raise exception ''accesos_oposicion_historial es inmutable''; end;' THEN
    RAISE EXCEPTION 'Estructura incompatible: fn_prevent_accesos_oposicion_historial_mutation';
  END IF;

  SELECT pg_get_triggerdef(t.oid), t.tgtype, t.tgenabled, t.tgfoid
    INTO trigger_definition, trigger_type, trigger_enabled, trigger_function
  FROM pg_trigger t
  WHERE t.tgrelid = 'public.accesos_oposicion_historial'::regclass
    AND t.tgname = 'trg_accesos_oposicion_historial_immutable'
    AND NOT t.tgisinternal;

  IF trigger_definition IS NULL THEN
    CREATE TRIGGER trg_accesos_oposicion_historial_immutable
      BEFORE UPDATE OR DELETE ON public.accesos_oposicion_historial
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_prevent_accesos_oposicion_historial_mutation();
  ELSIF trigger_type <> 27
     OR trigger_enabled <> 'O'
     OR trigger_function <> function_oid
     OR (trigger_type & 2) <> 2
     OR (trigger_type & 1) <> 1
     OR (trigger_type & (4 + 32)) <> 0
     OR (trigger_type & (8 + 16)) <> (8 + 16)
     OR trigger_definition !~* 'ON public\.accesos_oposicion_historial' THEN
    RAISE EXCEPTION 'Estructura incompatible: trg_accesos_oposicion_historial_immutable';
  END IF;
END $$;

-- 10) Validacion final dentro de la misma transaccion.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.accesos_oposicion
    WHERE estado = 'activo' AND modo_activo IS NULL
  ) THEN
    RAISE EXCEPTION 'Existe un acceso activo sin modo_activo';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.accesos_oposicion a
    LEFT JOIN public.acceso_oposicion_modelos m
      ON m.acceso_id = a.id AND m.modelo = a.modo_activo
    WHERE a.modo_activo IS NOT NULL AND m.id IS NULL
  ) THEN
    RAISE EXCEPTION 'modo_activo no esta incluido en los modelos';
  END IF;
END $$;
