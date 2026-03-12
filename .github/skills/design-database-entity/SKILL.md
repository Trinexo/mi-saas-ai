---
name: design-database-entity
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: design-database-entity
description: Diseñar una entidad de base de datos alineada con PostgreSQL y el modelo funcional del proyecto.
---

# Objetivo
Definir nuevas tablas y relaciones de forma consistente y escalable.

# Cuándo usarla
- Crear nuevas entidades
- Añadir relaciones entre módulos
- Diseñar tablas para progreso, tests, preguntas o suscripciones

# Qué debe hacer
1. Definir finalidad de la tabla
2. Proponer columnas
3. Definir PK y FK
4. Indicar índices
5. Explicar relación con el resto del modelo
6. Dar SQL compatible con PostgreSQL

# Reglas
- snake_case
- id como PK
- FK explícitas
- evitar duplicidad

# Entrada esperada
- Nombre de entidad
- Qué almacena
- Qué entidades relaciona

# Salida esperada
- Diseño de tabla
- Relaciones
- Índices
- SQL CREATE TABLE

# Ejemplo
Entrada: tabla para progreso de usuario por tema
Salida: progreso_usuario_tema con usuario_id, tema_id, aciertos, errores, tiempo_medio

# Archivos relacionados
database
migrations
schema.sql