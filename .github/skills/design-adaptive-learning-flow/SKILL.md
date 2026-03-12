---
name: design-adaptive-learning-flow
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: design-adaptive-learning-flow
description: Diseñar lógica de aprendizaje adaptativo basada en rendimiento del usuario.
---

# Objetivo
Ajustar selección de preguntas según el comportamiento del usuario.

# Cuándo usarla
- Reforzar temas débiles
- Priorizar preguntas falladas
- Personalizar tests

# Qué debe hacer
1. Identificar métricas relevantes
2. Definir reglas de priorización
3. Relacionar con historial del usuario
4. Integrarlo con generación de test

# Reglas
- Empezar simple para MVP
- No crear lógica opaca innecesaria

# Entrada esperada
- Métricas disponibles
- Tipo de adaptación deseado

# Salida esperada
- Modelo de datos mínimo
- Reglas de negocio
- Ejemplo de flujo

# Ejemplo
Entrada: priorizar preguntas falladas de los 3 temas más débiles
Salida: algoritmo y tablas implicadas

# Archivos relacionados
backend/src/services
database
analytics