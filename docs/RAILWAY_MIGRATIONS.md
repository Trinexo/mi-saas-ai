# Migraciones oficiales en Railway

La única fuente oficial de migraciones generales es:

~~~text
database/migrations
~~~

Railway debe configurar el servicio con:

- Root Directory: /
- Custom Config Path: /backend/railway.toml
- DATABASE_URL como única conexión de base de datos

El preDeployCommand ejecuta node backend/scripts/migrate-official.mjs. El
backend solo arranca después de que ese comando termine correctamente.

El runner:

- aplica los archivos SQL numerados en orden;
- no carga schema.sql ni seeds;
- registra nombre, checksum y estado en schema_migrations;
- usa un bloqueo advisory de PostgreSQL;
- detiene el despliegue ante errores;
- no repite migraciones registradas;
- rechaza cambios de checksum y estados incompletos.

## Baseline de una base existente

Una base ya creada antes de este runner debe verificarse previamente. Para
registrar una línea base conocida se puede ejecutar una única vez:

~~~text
MIGRATIONS_BASELINE=039_add_stripe_webhook_events.sql
~~~

El valor debe corresponder a un archivo existente en database/migrations.
Después de registrar la baseline debe eliminarse esa variable del entorno.
La migración siguiente se ejecutará normalmente.

No se debe usar baseline sobre una base vacía ni para ocultar una migración
fallida.

## Legacy

backend/database/migrations queda como histórico temporal. No se deben crear
allí nuevas migraciones. El script apply-backend-migrations.mjs conserva
compatibilidad con procedimientos antiguos, pero delega al runner oficial.
