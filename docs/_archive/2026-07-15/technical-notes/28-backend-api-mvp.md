# Backend API MVP

## Tecnologías

Node.js  
Express  
PostgreSQL  

---

# Instalación

cd backend

npm install

---

# Servidor básico

src/server.js

const express = require("express")
const app = express()

app.use(express.json())

app.get("/health",(req,res)=>{
res.json({status:"ok"})
})

app.listen(3000,()=>{
console.log("API running on port 3000")
})

Rutas principales

/auth
/oposiciones
/preguntas
/tests

Ejemplo endpoint preguntas

GET /preguntas?tema_id=1

Generar test

POST /tests/generate

body:

{
temas:[1,2],
numero_preguntas:20
}