---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->


# Reglas frontend

Aplican a React.

- componentes pequeños y reutilizables
- evitar lógica compleja en componentes de presentación
- separar llamadas API en servicios
- priorizar experiencia de usuario rápida para hacer tests
- mantener naming consistente con backend
- si un componente muestra preguntas, prever estados: cargando, error, sin datos y completado