✅ PR #18 validado

- Corregido `Payload inválido` en generate (1..100) y submit (tipos ID string/number).
- Añadido fallback de preguntas para evitar bloqueo por pool fresco en dataset pequeño.
- Aplicada limpieza UTF-8 (preguntas/opciones + catálogo: oposiciones/materias/temas).
- Añadido rol `profesor` acotado por oposición y gestión admin de sus asignaciones.

Verificado en local: tests backend OK, build frontend OK, flujo API generate+submit OK y asignaciones profesor-oposición OK.