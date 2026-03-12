---
name: design-analytics-module
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: design-analytics-module
description: Diseñar el módulo de estadísticas y seguimiento del usuario.
---

# Objetivo
Medir progreso y rendimiento de forma útil para usuario y producto.

# Cuándo usarla
- Crear dashboard de progreso
- Diseñar estadísticas por tema
- Crear analítica de tests

# Qué debe hacer
1. Identificar métricas clave
2. Definir tablas o vistas
3. Diseñar endpoints
4. Proponer visualización frontend

# Reglas
- Priorizar métricas accionables
- Empezar simple en MVP

# Entrada esperada
- Qué se quiere medir
- Nivel de detalle necesario

# Salida esperada
- Modelo analítico
- Endpoints
- Sugerencia de UI

# Ejemplo
Entrada: progreso por tema y media de aciertos
Salida: diseño de tabla agregada y endpoint GET /stats/themes

# Archivos relacionados
analytics
backend/src/services
frontend/src/pages