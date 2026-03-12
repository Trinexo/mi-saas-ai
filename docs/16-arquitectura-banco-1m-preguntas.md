# Arquitectura para banco de 1 millón de preguntas

## Objetivo

Permitir gestionar grandes volúmenes de contenido.

---

# Problemas comunes

- consultas lentas
- duplicación preguntas
- dificultad clasificación

---

# Solución

Separar almacenamiento.

---

# Bases de datos

## Base principal

usuarios  
tests  
resultados  

---

## Base de contenido

preguntas  
temas  
materias  

---

## Motor de búsqueda

ElasticSearch

Permite:

- búsqueda rápida
- filtrado por tema
- filtrado por dificultad

---

# Caché

Redis para:

- preguntas frecuentes
- test generados

---

# Generación masiva

Pipeline:

temario  
↓  
generación preguntas  
↓  
validación  
↓  
base de datos

---

# Escalabilidad

Con esta arquitectura se pueden manejar:

- 1M preguntas
- 100M respuestas
- 10k usuarios simultáneos