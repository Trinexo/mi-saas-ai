---
name: create-backend-module
description: Describe what this skill does and when to use it. Include keywords that help agents identify relevant tasks.
---

<!-- Tip: Use /create-skill in chat to generate content with agent assistance -->

---
name: create-backend-module
description: Crear un módulo backend completo cuando se necesite una nueva funcionalidad de negocio en Node.js + Express.
---

# Objetivo
Crear un módulo backend completo y consistente siguiendo la arquitectura del proyecto.

# Cuándo usarla
- Cuando haya que crear una nueva funcionalidad del backend
- Cuando se necesite añadir un nuevo recurso o dominio
- Cuando haya que generar estructura route/controller/service/repository

# Qué debe hacer
1. Identificar el nombre del módulo
2. Proponer estructura de archivos
3. Crear route
4. Crear controller
5. Crear service
6. Crear repository
7. Mantener naming coherente con el proyecto
8. Añadir ejemplo de endpoint

# Reglas
- Usar Node.js + Express
- Separar routes, controllers, services y repositories
- No poner lógica de negocio en routes
- No poner SQL en controllers
- Seguir naming consistente

# Entrada esperada
- Nombre del módulo
- Finalidad
- Entidades implicadas

# Salida esperada
- Estructura de archivos
- Código base de cada capa
- Ejemplo de request/response

# Ejemplo
Entrada: crear módulo para guardar resultados de test
Salida: test-results.routes.js, test-results.controller.js, test-results.service.js, test-results.repository.js

# Archivos relacionados
backend/src/routes
backend/src/controllers
backend/src/services
backend/src/repositories