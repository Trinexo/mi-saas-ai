-- Re-sincroniza las secuencias asociadas a columnas BIGSERIAL/SERIAL/IDENTITY.
-- Util para entornos restaurados desde dumps o importaciones con IDs explicitos.

DO $$
DECLARE
  seq_record RECORD;
  max_id BIGINT;
BEGIN
  FOR seq_record IN
    SELECT
      seq_ns.nspname AS sequence_schema,
      seq.relname AS sequence_name,
      table_ns.nspname AS table_schema,
      table_cls.relname AS table_name,
      attr.attname AS column_name
    FROM pg_class seq
    JOIN pg_namespace seq_ns
      ON seq_ns.oid = seq.relnamespace
    JOIN pg_depend dep
      ON dep.objid = seq.oid
     AND dep.deptype IN ('a', 'i')
    JOIN pg_class table_cls
      ON table_cls.oid = dep.refobjid
    JOIN pg_namespace table_ns
      ON table_ns.oid = table_cls.relnamespace
    JOIN pg_attribute attr
      ON attr.attrelid = table_cls.oid
     AND attr.attnum = dep.refobjsubid
    WHERE seq.relkind = 'S'
      AND table_ns.nspname = 'public'
  LOOP
    EXECUTE format(
      'SELECT COALESCE(MAX(%I), 0) FROM %I.%I',
      seq_record.column_name,
      seq_record.table_schema,
      seq_record.table_name
    )
    INTO max_id;

    EXECUTE format(
      'SELECT setval(%L::regclass, %s, %L)',
      format('%I.%I', seq_record.sequence_schema, seq_record.sequence_name),
      GREATEST(max_id, 1),
      max_id > 0
    );
  END LOOP;
END $$;
