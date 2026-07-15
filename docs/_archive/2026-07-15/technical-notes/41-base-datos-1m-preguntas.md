# Base de datos optimizada para 1 millón de preguntas

## Objetivo

Diseñar un sistema de almacenamiento capaz de manejar:

- 1M preguntas
- 100M respuestas
- miles de usuarios concurrentes

---

# Arquitectura de base de datos

Se recomienda dividir la base de datos en tres dominios:

1 contenido
2 actividad
3 analítica

---

# Base de datos contenido

Tablas principales:

oposiciones
materias
temas
preguntas
opciones_respuesta

---

# Tabla preguntas

id BIGSERIAL PRIMARY KEY

tema_id INTEGER

tipo_pregunta SMALLINT

enunciado TEXT

nivel_dificultad SMALLINT

estado SMALLINT

fecha_creacion TIMESTAMP

---

# Índices necesarios

CREATE INDEX idx_pregunta_tema
ON preguntas(tema_id)

CREATE INDEX idx_pregunta_dificultad
ON preguntas(nivel_dificultad)

---

# Particionado

Para grandes volúmenes:

PARTITION BY tema_id

Esto permite consultas rápidas.

---

# Base actividad usuario

Tablas:

respuestas_usuario
tests
test_preguntas
progreso_usuario

---

# Base analítica

Tablas:

estadisticas_pregunta
estadisticas_usuario
estadisticas_tema

---

# Beneficios

- consultas rápidas
- escalabilidad horizontal
- analítica eficiente