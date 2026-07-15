---
name: optimize-query
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: optimize-query
description: Revisar y optimizar consultas SQL problemáticas.
---

# Objetivo
Reducir tiempos de respuesta y cuellos de botella.

# Cuándo usarla
- Consultas lentas
- JOINs complejos
- Generación de test pesada
- Panel admin con listados grandes

# Qué debe hacer
1. Analizar consulta
2. Detectar problema
3. Proponer índices
4. Simplificar SQL si procede
5. Explicar mejora

# Reglas
- PostgreSQL
- priorizar claridad y rendimiento
- no optimizar sin contexto

# Entrada esperada
- Query actual
- Objetivo
- Volumen estimado

# Salida esperada
- Query optimizada
- Índices sugeridos
- Explicación breve

# Ejemplo
Entrada: consulta lenta de preguntas por tema y dificultad
Salida: query optimizada + índices

# Archivos relacionados
database
repositories