
---

# 6️⃣4️⃣ `64-ejecutar-mvp-local.md`

```md id="run-mvp"
# Ejecutar MVP en local

## Requisitos

Node.js 18+

PostgreSQL

---

# Paso 1

Crear base de datos

CREATE DATABASE test_platform;

---

# Paso 2

Ejecutar schema SQL

psql test_platform < schema.sql

---

# Paso 3

Instalar backend

cd backend

npm install

---

# Paso 4

Iniciar servidor

node server.js

---

# Paso 5

Probar API

GET

http://localhost:3000/preguntas

---

# Generar test

POST

http://localhost:3000/tests/generate

body:

{
tema_id:1
}

---

# Resultado

La API devolverá un conjunto de preguntas para el test.
