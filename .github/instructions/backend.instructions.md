---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Reglas backend

Aplican a archivos de backend.

- usar Node.js + Express
- separar en routes, controllers, services y repositories
- validaciones antes de ejecutar lógica de negocio
- no hacer consultas SQL directamente en las rutas
- los services contienen la lógica de negocio
- los repositories encapsulan acceso a PostgreSQL
- manejar errores con respuestas consistentes
- documentar endpoints nuevos con ejemplo de request y response
- priorizar queries simples y con índices claros