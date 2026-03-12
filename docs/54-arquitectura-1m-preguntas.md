# Arquitectura para manejar 1 millón de preguntas

## Objetivo

Diseñar un sistema capaz de manejar grandes volúmenes de contenido.

---

# Componentes

Frontend

API

Motor de test

Base de datos

Cache

Motor de búsqueda

---

# Base de datos

PostgreSQL

Particionado por tema.

---

# Cache

Redis

Guardar:

preguntas frecuentes

tests generados

---

# Motor de búsqueda

ElasticSearch

Permite:

filtrar preguntas rápidamente

buscar contenido

---

# Flujo

Usuario solicita test

↓

API consulta Redis

↓

si no existe

consulta base datos

↓

cachea resultado