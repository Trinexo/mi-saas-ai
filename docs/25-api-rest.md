# API REST de la plataforma

## Autenticación

POST /auth/login  
POST /auth/register

---

# Oposiciones

GET /oposiciones

GET /oposiciones/{id}

---

# Materias

GET /materias?oposicion_id=

---

# Temas

GET /temas?materia_id=

---

# Preguntas

GET /preguntas?tema_id=

POST /preguntas

PUT /preguntas/{id}

DELETE /preguntas/{id}

---

# Test

POST /tests/generate

body:

{
temas:[1,2,3],
numero_preguntas:20
}

---

# Enviar test

POST /tests/submit

body:

{
test_id:10,
respuestas:[
{pregunta_id:1,respuesta_id:3}
]
}

---

# Estadísticas

GET /stats/user

GET /stats/tema