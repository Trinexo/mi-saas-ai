# Migraciones y baseline oficial PostgreSQL

La fuente única de migraciones históricas es:

```text
database/migrations
```

La baseline estructural vigente del proyecto es:

```text
042_commercial_access_history.sql
```

## Base nueva

Para una base local vacía se usa el bootstrap del snapshot 042:

```text
$env:ALLOW_LOCAL_DB_BOOTSTRAP = 'true'
$env:BOOTSTRAP_CONFIRM = 'BASELINE_042'
$env:BOOTSTRAP_LOAD_SEED = 'true'       # opcional para desarrollo/CI
npm.cmd --prefix backend run db:bootstrap
npm.cmd --prefix backend run db:migrate
```

El bootstrap:

- exige una URL PostgreSQL local;
- exige confirmación explícita;
- carga `database/schema.sql` sin datos funcionales;
- carga `database/seed.sql` solo si se solicita expresamente;
- registra checksums de todas las migraciones 001–042 con `source=schema`;
- no reejecuta las migraciones ya incorporadas en el snapshot.

El runner queda preparado para aplicar futuras migraciones 043 y posteriores.

`schema.sql` y `seed.sql` son responsabilidades separadas: el seed contiene
solo datos demo/CI y nunca debe cargarse automáticamente en producción.

En Windows, cuando se use `psql`, debe establecerse explícitamente:

```powershell
$env:PGCLIENTENCODING = 'UTF8'
```

## Base histórica existente

`baseline-migrations.mjs` es una herramienta conservadora para una base ya
existente y auditada. No crea tablas ni ejecuta migraciones. No debe usarse
sobre una base vacía ni para ocultar una migración fallida.

La herramienta `reconcile-baseline-checksums.mjs` conserva únicamente el flujo
histórico de baseline 038 y no forma parte del bootstrap vigente.

## Railway

Railway ejecuta únicamente:

```text
node backend/scripts/migrate-official.mjs
```

El pre-deploy no carga `schema.sql`, `seed.sql` ni ejecuta un reset. La base de
Railway debe existir previamente y conservar un registro coherente de
`schema_migrations`.
