SELECT concat(
  'ALTER TABLE ', t.tablename,
  ' ADD CONSTRAINT ', c.conname,
  ' PRIMARY KEY (',
  string_agg(a.attname, ', ' ORDER BY array_position(c.conkey, a.attnum)),
  ');'
)
FROM pg_tables t
JOIN pg_class cl ON cl.relname = t.tablename
  AND cl.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
JOIN pg_constraint c ON c.conrelid = cl.oid AND c.contype = 'p'
JOIN pg_attribute a ON a.attrelid = cl.oid AND a.attnum = ANY(c.conkey)
WHERE t.schemaname = 'public'
GROUP BY t.tablename, c.conname
ORDER BY t.tablename;
