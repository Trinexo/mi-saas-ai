export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  return value;
}

export function requireConfirmation(name) {
  if (process.env[name] !== 'true') {
    throw new Error(`Operación protegida: establece ${name}=true para continuar`);
  }
}

export function sslForDatabaseUrl(connectionString) {
  const url = new URL(connectionString);
  return ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    ? undefined
    : { rejectUnauthorized: false };
}
