# Sprint 6 — PR 01 — Tabla `repeticion_espaciada`

Sprint: 6
Fecha: 13 de marzo de 2026
Estado: pendiente

## Qué cambia

### `database/schema.sql`
- Nueva tabla `repeticion_espaciada`:
  ```sql
  CREATE TABLE IF NOT EXISTS repeticion_espaciada (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    pregunta_id BIGINT NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    nivel_memoria SMALLINT NOT NULL DEFAULT 0,
    proxima_revision TIMESTAMP NOT NULL DEFAULT NOW(),
    ultima_revision TIMESTAMP NOT NULL DEFAULT NOW(),
    racha_aciertos SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (usuario_id, pregunta_id)
  );
  ```
- 2 índices nuevos:
  - `idx_repaso_usuario_proxima ON repeticion_espaciada(usuario_id, proxima_revision)` — consulta principal (preguntas vencidas)
  - `idx_repaso_pregunta ON repeticion_espaciada(pregunta_id)` — soporte a eliminación en cascada

## Alcance
- Solo DDL — sin cambios en backend ni frontend.
- La tabla empieza vacía; se populará en PR 02 con cada submit.

## Fuera de alcance
- Migración de datos históricos de `respuestas_usuario` a `repeticion_espaciada`.
- Particionado o archivado de filas antiguas.

## Validación local
- Aplicar `schema.sql` en DB de desarrollo: tabla creada, índices creados.
- `SELECT * FROM repeticion_espaciada LIMIT 1;` — retorna 0 filas sin error.
