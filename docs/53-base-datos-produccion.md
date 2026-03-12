# Base de datos lista para producción

## Objetivo

Definir una base de datos optimizada para producción que soporte:

- millones de preguntas
- millones de respuestas
- miles de usuarios concurrentes

---

# Esquema general

usuarios
oposiciones
materias
temas
preguntas
opciones_respuesta

tests
test_preguntas
respuestas_usuario

progreso_usuario
repeticion_espaciada

---

# Tabla usuarios

id BIGSERIAL PRIMARY KEY

email TEXT UNIQUE

password_hash TEXT

fecha_registro TIMESTAMP

estado SMALLINT

---

# Tabla preguntas

id BIGSERIAL PRIMARY KEY

tema_id INTEGER

tipo SMALLINT

enunciado TEXT

nivel_dificultad SMALLINT

fecha_creacion TIMESTAMP

estado SMALLINT

---

# Índices recomendados

CREATE INDEX idx_preguntas_tema
ON preguntas(tema_id)

CREATE INDEX idx_preguntas_dificultad
ON preguntas(nivel_dificultad)

---

# Tabla respuestas_usuario

id BIGSERIAL PRIMARY KEY

usuario_id BIGINT

pregunta_id BIGINT

correcta BOOLEAN

fecha_respuesta TIMESTAMP
