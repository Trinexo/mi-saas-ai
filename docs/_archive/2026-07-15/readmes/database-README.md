# Base de datos (Sprint 1)

## Archivos

- `schema.sql`: estructura principal MVP
- `seed.sql`: datos iniciales de ejemplo

## Ejecución

1. Crear base de datos `plataforma_test` en PostgreSQL.
2. Ejecutar `schema.sql`.
3. Ejecutar `seed.sql`.

Comandos ejemplo:

```bash
psql -U postgres -d plataforma_test -f database/schema.sql
psql -U postgres -d plataforma_test -f database/seed.sql
```