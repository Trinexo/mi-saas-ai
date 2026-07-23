# Scripts históricos de base de datos

Los scripts de `backend/scripts/` que migran datos o realizan operaciones administrativas no contienen credenciales embebidas. Deben recibir sus conexiones mediante variables de entorno.

Variables:

- `LOCAL_DB_URL`: conexión local para `migrate-content.mjs`, `migrate-users.mjs` y `check-passwords.mjs`.
- `RAILWAY_DB_URL`: conexión remota explícita para `migrate-content.mjs`, `migrate-users.mjs`, `clean-users.mjs` y `reset-passwords.mjs`.
- `ALLOW_REMOTE_MIGRATION=true`: confirmación obligatoria para las migraciones de contenido y usuarios.
- `ALLOW_CLEAN_USERS=true`: confirmación obligatoria para la eliminación de usuarios.
- `ALLOW_PASSWORD_RESET=true`: confirmación obligatoria para `reset-passwords.mjs`.
- `RESET_PASSWORD`: contraseña temporal introducida fuera del repositorio por `reset-passwords.mjs`; nunca se imprime.
- `CHECK_PASSWORD_HASH`: hash bcrypt de referencia para `check-passwords.mjs`.

`backend/legacy-scripts.env.example` contiene únicamente nombres y valores ficticios. El archivo local equivalente está ignorado por Git. Estos scripts no forman parte del arranque de la aplicación ni del runner oficial de migraciones.

La conexión que estuvo versionada en estos scripts debe considerarse expuesta. Esta corrección no rota credenciales ni reescribe el historial; ambas acciones requieren autorización separada.
