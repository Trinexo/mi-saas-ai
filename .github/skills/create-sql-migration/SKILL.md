---
name: create-sql-migration
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: create-sql-migration
description: Crear migraciones SQL para PostgreSQL con cambios estructurados y seguros.
---

# Objetivo
Generar migraciones claras para crear o modificar tablas.

# Cuándo usarla
- Alta de tablas
- Modificación de columnas
- Creación de índices
- Añadir claves foráneas

# Qué debe hacer
1. Describir cambio
2. Generar SQL de migración
3. Añadir índices necesarios
4. Añadir rollback si aplica

# Reglas
- PostgreSQL
- naming coherente
- cambios pequeños y trazables

# Entrada esperada
- Cambio deseado
- Tabla afectada
- Relación con otras tablas

# Salida esperada
- SQL up
- SQL down si aplica
- explicación breve

# Ejemplo
Entrada: añadir columna nivel_dificultad a preguntas
Salida: ALTER TABLE + índice si procede

# Archivos relacionados
database/migrations
database/schema.sql