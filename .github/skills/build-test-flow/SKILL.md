---
name: build-test-flow
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: build-test-flow
description: Diseñar o implementar el flujo completo de generación, respuesta y corrección de tests.
---

# Objetivo
Construir el flujo principal de negocio de la plataforma.

# Cuándo usarla
- Generar test por tema
- Crear simulacros
- Registrar respuestas
- Calcular resultados

# Qué debe hacer
1. Definir origen de preguntas
2. Generar test
3. Guardar intento
4. Registrar respuestas
5. Corregir
6. Guardar resultados
7. Actualizar progreso

# Reglas
- Mantener consistencia entre backend y base de datos
- Separar generación, corrección y persistencia

# Entrada esperada
- Tipo de test
- Criterio de selección
- Número de preguntas

# Salida esperada
- Flujo técnico
- Tablas implicadas
- Endpoints implicados
- Código base

# Ejemplo
Entrada: simulacro de 50 preguntas
Salida: flujo desde POST /tests/generate hasta POST /tests/submit

# Archivos relacionados
backend/src/services
backend/src/repositories
database