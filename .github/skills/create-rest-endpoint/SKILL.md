---
name: create-rest-endpoint
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: create-rest-endpoint
description: Crear un endpoint REST completo y documentado para una funcionalidad concreta.
---

# Objetivo
Generar endpoints REST consistentes con el modelo del proyecto.

# Cuándo usarla
- Crear endpoints GET, POST, PUT, DELETE
- Añadir operaciones sobre preguntas, tests, resultados o progreso

# Qué debe hacer
1. Definir método HTTP
2. Definir ruta
3. Validar entrada
4. Conectar controller con service
5. Devolver respuesta consistente
6. Documentar request y response
7. Añadir manejo básico de errores

# Reglas
- Seguir convención REST
- Mantener nombres claros
- No mezclar validación, negocio y persistencia en el mismo archivo

# Entrada esperada
- Recurso
- Acción
- Payload esperado

# Salida esperada
- Endpoint completo
- Request ejemplo
- Response ejemplo
- Errores posibles

# Ejemplo
Entrada: crear endpoint para generar test
Salida: POST /tests/generate con body y respuesta JSON

# Archivos relacionados
backend/src/routes
backend/src/controllers
backend/src/services