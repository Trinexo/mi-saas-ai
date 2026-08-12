import app from './app.js';
import pool from './config/db.js';
import { assertPostgresUtc } from './config/postgres-timezone.guard.js';

const port = Number(process.env.PORT || 3000);

try {
  await assertPostgresUtc(pool);
  app.listen(port, () => console.log(`API running on port ${port}`));
} catch (error) {
  console.error(`[startup] PostgreSQL timezone guard failed: ${error.code ?? 'UNKNOWN'}`);
  await pool.end().catch(() => {});
  process.exitCode = 1;
}
