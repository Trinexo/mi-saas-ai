---
description: Describe when these instructions should be loaded by the agent based on task context
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

# Contexto del proyecto

Estamos desarrollando una plataforma web de entrenamiento por test para oposiciones.

## Objetivo del producto
La aplicación debe permitir:
- gestionar un banco de preguntas estructurado por oposición, materia, tema y subtema
- generar tests dinámicos
- realizar simulacros de examen
- corregir automáticamente respuestas
- guardar historial y progreso
- reforzar preguntas falladas
- evolucionar hacia aprendizaje adaptativo y repetición espaciada
- gestionar planes de suscripción
- administrar contenido desde un panel interno

## Stack técnico
- Frontend: React
- Backend: Node.js + Express
- Base de datos: PostgreSQL

## Principios del proyecto
- arquitectura simple, mantenible y escalable
- separación clara de capas: routes, controllers, services, repositories
- consultas SQL optimizadas
- código legible y modular
- evitar sobreingeniería en fase MVP
- diseñar pensando en crecimiento futuro del banco de preguntas
- mantener naming consistente en backend, frontend y base de datos

## Modelo funcional base
La plataforma gira en torno a:
- usuarios
- oposiciones
- materias
- temas
- preguntas
- opciones de respuesta
- tests
- respuestas de usuario
- resultados
- progreso
- repetición espaciada
- suscripciones
- panel de administración

## Reglas de trabajo
- responder en español
- priorizar soluciones aplicables al proyecto
- si hay varias opciones, recomendar una para MVP y otra para escalado
- cuando generes código, devolverlo listo para copiar
- cuando diseñes tablas, indicar relaciones e índices
- cuando diseñes endpoints, indicar request y response
- no inventar entidades o flujos sin mantener consistencia con el modelo del proyecto
- si una decisión afecta rendimiento o escalabilidad, explicarlo de forma breve

## Qué evitar
- microservicios en la fase inicial
- dependencias innecesarias
- lógica de negocio dentro de controladores
- respuestas genéricas
- soluciones acopladas a un proveedor cloud concreto

## Cómo responder
- responder en español
- dar soluciones prácticas
- si hay varias opciones, recomendar una para MVP y otra para escalado
- cuando proceda, devolver código listo para copiar

## Documentación del proyecto

La documentación técnica del proyecto se encuentra en:

/docs/architecture/

Incluye 68 documentos que describen:

- arquitectura del sistema
- diseño del banco de preguntas
- modelo de base de datos
- generación de tests
- aprendizaje adaptativo
- analítica
- monetización
- despliegue
- roadmap técnico

Cuando sea necesario tomar decisiones de arquitectura o diseño, consulta estos documentos como fuente de referencia.