const UTC_GUARD_QUERY = `
  SELECT current_setting('TimeZone') AS timezone,
         (NOW() AT TIME ZONE current_setting('TimeZone'))
           = (NOW() AT TIME ZONE 'UTC') AS is_utc
`;

export async function assertPostgresUtc(pool) {
  if (!pool || typeof pool.connect !== 'function') throw new Error('La guarda PostgreSQL requiere un pool válido');
  let client;
  try {
    client = await pool.connect();
    const row = (await client.query(UTC_GUARD_QUERY)).rows?.[0];
    if (!row?.is_utc) {
      const error = new Error('PostgreSQL debe usar un timezone equivalente a UTC');
      error.code = 'POSTGRES_TIMEZONE_NOT_UTC';
      error.timezone = typeof row?.timezone === 'string' ? row.timezone : 'desconocido';
      throw error;
    }
    return row.timezone;
  } catch (error) {
    if (error?.code === 'POSTGRES_TIMEZONE_NOT_UTC') throw error;
    const wrapped = new Error('No se pudo verificar el timezone de PostgreSQL');
    wrapped.code = 'POSTGRES_TIMEZONE_GUARD_FAILED';
    wrapped.cause = error;
    throw wrapped;
  } finally { client?.release(); }
}

export { UTC_GUARD_QUERY };
