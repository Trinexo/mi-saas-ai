# Esquema SQL base ejecutable

## Base de datos PostgreSQL

---

CREATE TABLE usuarios (

id BIGSERIAL PRIMARY KEY,

email TEXT UNIQUE NOT NULL,

password_hash TEXT NOT NULL,

fecha_registro TIMESTAMP DEFAULT NOW()

);

---

CREATE TABLE oposiciones (

id BIGSERIAL PRIMARY KEY,

nombre TEXT,

descripcion TEXT

);

---

CREATE TABLE materias (

id BIGSERIAL PRIMARY KEY,

oposicion_id BIGINT REFERENCES oposiciones(id),

nombre TEXT

);

---

CREATE TABLE temas (

id BIGSERIAL PRIMARY KEY,

materia_id BIGINT REFERENCES materias(id),

nombre TEXT

);

---

CREATE TABLE preguntas (

id BIGSERIAL PRIMARY KEY,

tema_id BIGINT REFERENCES temas(id),

enunciado TEXT,

nivel_dificultad INTEGER

);

---

CREATE TABLE opciones_respuesta (

id BIGSERIAL PRIMARY KEY,

pregunta_id BIGINT REFERENCES preguntas(id),

texto TEXT,

correcta BOOLEAN

);

---

CREATE TABLE tests (

id BIGSERIAL PRIMARY KEY,

usuario_id BIGINT REFERENCES usuarios(id),

fecha TIMESTAMP DEFAULT NOW()

);

---

CREATE TABLE respuestas_usuario (

id BIGSERIAL PRIMARY KEY,

test_id BIGINT REFERENCES tests(id),

pregunta_id BIGINT,

respuesta_id BIGINT,

correcta BOOLEAN

);
