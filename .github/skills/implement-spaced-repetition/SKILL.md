---
name: implement-spaced-repetition
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: implement-spaced-repetition
description: Implementar repetición espaciada para reforzar memoria y retención.
---

# Objetivo
Programar revisiones automáticas de preguntas en función del rendimiento.

# Cuándo usarla
- Crear revisiones periódicas
- Diseñar repasos inteligentes
- Completar módulo de refuerzo

# Qué debe hacer
1. Definir niveles de memoria
2. Calcular próxima revisión
3. Guardar estado por usuario y pregunta
4. Integrar con test de repaso

# Reglas
- Empezar con reglas simples
- Mantener trazabilidad del cálculo

# Entrada esperada
- Resultado de una pregunta
- Estado previo del usuario

# Salida esperada
- Tabla necesaria
- Fórmula o reglas
- Flujo técnico

# Ejemplo
Entrada: usuario falla una pregunta ya vista
Salida: próxima revisión en 1 día y reinicio de nivel

# Archivos relacionados
database
backend/src/services