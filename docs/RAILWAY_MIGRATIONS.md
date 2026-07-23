# Migraciones oficiales en Railway

La única fuente oficial de migraciones generales es:

~~~text
database/migrations
~~~

Railway debe configurar el servicio con:

- Root Directory: /
- Custom Config Path: /backend/railway.toml
- DATABASE_URL como única conexión de base de datos

El preDeployCommand ejecuta únicamente node backend/scripts/migrate-official.mjs.
El backend solo arranca después de que ese comando termine correctamente.

El runner:

- aplica archivos SQL numerados en orden;
- no carga schema.sql ni seeds;
- registra nombre, checksum y estado aplicado;
- usa un bloqueo advisory de PostgreSQL;
- ejecuta cada migración y su registro en una transacción;
- rechaza cambios de checksum y estados incompletos.

## Baseline de una base existente

Una base ya creada antes de este runner debe verificarse previamente. Para
registrar una línea base se ejecuta manualmente:

~~~text
npm run db:baseline -- --through=039_add_stripe_webhook_events.sql --dry-run
npm run db:baseline -- --through=039_add_stripe_webhook_events.sql --confirm=BASELINE
~~~

El primer comando solo informa. El segundo requiere confirmación explícita,
valida el esquema y registra checksums sin ejecutar SQL de migración.
La baseline no debe ejecutarse desde pre-deploy ni start.

No se debe usar baseline sobre una base vacía ni para ocultar una migración
fallida. schema.sql representa la baseline
038_accesos_ranking_publico.sql en el bootstrap local de Compose.

## Legacy

backend/database/migrations queda como histórico temporal. No se deben crear
allí nuevas migraciones. apply-backend-migrations.mjs delega al runner oficial;
los demás loaders históricos están bloqueados o requieren una confirmación
local explícita.
