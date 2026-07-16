---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Reglas base de datos

Aplican a SQL, migraciones y diseño de tablas.

- usar PostgreSQL
- nombres en snake_case
- claves primarias id
- claves foráneas explícitas
- crear índices cuando una consulta lo justifique
- evitar duplicidad de campos
- separar entidades de contenido, actividad y analítica cuando sea necesario
- cualquier propuesta de tabla debe indicar su relación con el modelo principal