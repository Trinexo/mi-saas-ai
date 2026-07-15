
---


```md id="ztlpy6"
# Modelo SQL inicial

Base de datos PostgreSQL

---

# Tabla usuarios

CREATE TABLE usuarios(

id SERIAL PRIMARY KEY,

nombre TEXT,

email TEXT UNIQUE,

password_hash TEXT,

fecha_registro TIMESTAMP

);

---

# Tabla oposiciones

CREATE TABLE oposiciones(

id SERIAL PRIMARY KEY,

nombre TEXT,

descripcion TEXT

);

---

# Tabla materias

CREATE TABLE materias(

id SERIAL PRIMARY KEY,

oposicion_id INTEGER,

nombre TEXT

);

---

# Tabla temas

CREATE TABLE temas(

id SERIAL PRIMARY KEY,

materia_id INTEGER,

nombre TEXT

);

---

# Tabla preguntas

CREATE TABLE preguntas(

id SERIAL PRIMARY KEY,

tema_id INTEGER,

tipo TEXT,

enunciado TEXT,

explicacion TEXT,

nivel_dificultad INTEGER

);

---

# Tabla opciones_respuesta

CREATE TABLE opciones_respuesta(

id SERIAL PRIMARY KEY,

pregunta_id INTEGER,

texto TEXT,

correcta BOOLEAN

);