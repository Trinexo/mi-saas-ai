
---

# 3️⃣0️⃣ `30-seed-datos-iniciales.md`

```md id="seed-database"
# Datos iniciales para base de datos

## Objetivo

Cargar datos mínimos para pruebas del sistema.

---

# Insertar oposición

INSERT INTO oposiciones(nombre)

VALUES

('Auxiliar Administrativo');

---

# Insertar materia

INSERT INTO materias(oposicion_id,nombre)

VALUES

(1,'Constitución');

---

# Insertar tema

INSERT INTO temas(materia_id,nombre)

VALUES

(1,'Tema 1');

---

# Insertar pregunta

INSERT INTO preguntas(tema_id,tipo,enunciado)

VALUES

(1,'test','¿Cuál es la capital de España?');

---

# Insertar opciones

INSERT INTO opciones_respuesta(pregunta_id,texto,correcta)

VALUES

(1,'Madrid',true),

(1,'Barcelona',false),

(1,'Valencia',false),

(1,'Sevilla',false);