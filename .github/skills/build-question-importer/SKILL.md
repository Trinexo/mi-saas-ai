---
name: bluid-test-flow
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: build-question-importer
description: Crear el flujo de importación de preguntas desde CSV u otras fuentes estructuradas.
---

# Objetivo
Permitir cargar bancos de preguntas de forma controlada.

# Cuándo usarla
- Importar preguntas iniciales
- Cargar lotes masivos
- Validar estructura de contenido

# Qué debe hacer
1. Definir formato del archivo
2. Validar columnas
3. Mapear oposición, materia, tema y pregunta
4. Detectar duplicados
5. Insertar registros
6. Reportar errores

# Reglas
- No insertar registros incompletos
- Validar referencias previas
- Evitar duplicados obvios

# Entrada esperada
- Formato fuente
- Columnas disponibles
- Reglas de mapeo

# Salida esperada
- Estructura CSV
- Script de importación
- Reglas de validación

# Ejemplo
Entrada: CSV con enunciado, opciones, correcta y tema_id
Salida: script Node.js de importación

# Archivos relacionados
scripts
database
admin