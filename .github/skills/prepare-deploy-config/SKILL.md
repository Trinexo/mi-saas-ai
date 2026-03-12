---
name: prepare-deploy-config
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: prepare-deploy-config
description: Preparar configuración mínima de despliegue para desarrollo y producción.
---

# Objetivo
Dejar backend, frontend y base de datos listos para ejecutarse con configuración clara.

# Cuándo usarla
- Preparar entorno local
- Configurar producción
- Definir variables de entorno

# Qué debe hacer
1. Listar variables necesarias
2. Separar entorno local y producción
3. Proponer estructura de despliegue
4. Identificar dependencias externas

# Reglas
- Mantener despliegue simple para MVP
- Evitar lock-in innecesario

# Entrada esperada
- Stack actual
- Entornos necesarios

# Salida esperada
- Variables de entorno
- Pasos de despliegue
- Recomendación de hosting MVP

# Ejemplo
Entrada: desplegar React + Express + PostgreSQL
Salida: estructura y variables necesarias

# Archivos relacionados
.env
README
deploy