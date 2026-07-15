---
name: design-subscription-flow
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: design-subscription-flow
description: Diseñar el acceso freemium y premium de la plataforma.
---

# Objetivo
Modelar planes y restricciones de acceso.

# Cuándo usarla
- Crear planes
- Limitar funcionalidades free
- Preparar integración con pagos

# Qué debe hacer
1. Definir planes
2. Definir permisos por plan
3. Diseñar tablas de suscripción
4. Diseñar validación de acceso
5. Preparar integración futura

# Reglas
- Empezar con modelo simple
- Separar negocio de pagos

# Entrada esperada
- Planes
- Límites
- Funcionalidades premium

# Salida esperada
- Tablas
- Reglas de acceso
- Endpoints necesarios

# Ejemplo
Entrada: plan gratis con 10 tests al día y premium ilimitado
Salida: diseño de permisos y chequeo de acceso

# Archivos relacionados
database
backend/src/services
billing