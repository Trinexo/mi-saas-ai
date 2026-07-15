# Plataforma de entrenamiento con test para oposiciones

## Objetivo del sistema

Desarrollar una plataforma web (y posteriormente app móvil) que permita a los usuarios:

- Preparar oposiciones mediante test interactivos autocorregibles
- Practicar por temas, bloques o simulaciones de examen
- Analizar su progreso mediante estadísticas
- Reforzar contenidos mediante test de preguntas falladas
- Realizar simulacros de examen
- Resolver supuestos prácticos

El sistema funcionará como:

- herramienta de estudio
- simulador de examen
- sistema de seguimiento del progreso

---

# Arquitectura general del sistema

## Módulos principales

### Gestión de contenidos
Administra:

- oposiciones
- materias
- temas
- preguntas
- explicaciones
- normativa asociada

### Motor de generación de test

Responsable de:

- crear exámenes dinámicos
- seleccionar preguntas
- aplicar reglas de puntuación
- controlar temporizadores

### Motor de evaluación

Gestiona:

- corrección automática
- cálculo de nota
- penalización por error
- estadísticas

### Sistema de aprendizaje adaptativo

Permite:

- reforzar preguntas falladas
- detectar debilidades
- repetir preguntas complejas

### Analítica de progreso

Genera:

- histórico de resultados
- estadísticas por tema
- evolución del usuario

---

# Modelo de contenido

## Jerarquía

Oposición  
→ Materia  
→ Tema  
→ Preguntas

Ejemplo:

Auxiliar Administrativo  
→ Constitución  
→ Tema 1  
→ Pregunta

---

# Tipos de test

## Test por tema

- preguntas de un solo tema
- ideal para estudio

## Test por bloque

- preguntas de varios temas
- consolidación de conocimiento

## Test personalizado

El usuario elige:

- materias
- temas
- número de preguntas

## Simulacro de examen

Replica examen real:

- número fijo de preguntas
- temporizador
- penalización

## Test de refuerzo

Generado con:

- preguntas falladas
- preguntas en blanco
- preguntas dudosas

## Test de repaso rápido

- 10–20 preguntas
- sin temporizador

## Supuestos prácticos

Caso práctico + preguntas asociadas.

## Retos

- competir con otros usuarios
- ranking semanal