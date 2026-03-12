# Backend funcional mínimo

## Tecnologías

Node.js

Express

PostgreSQL

---

# Instalación

npm init

npm install express pg cors

---

# server.js

import express from "express"
import pkg from "pg"

const {Pool}=pkg

const pool=new Pool({
user:"postgres",
password:"password",
database:"test_platform"
})

const app=express()

app.use(express.json())

app.get("/preguntas", async(req,res)=>{

const result=await pool.query(
"SELECT * FROM preguntas LIMIT 10"
)

res.json(result.rows)

})

app.post("/tests/generate", async(req,res)=>{

const {tema_id}=req.body

const result=await pool.query(
`SELECT * FROM preguntas
WHERE tema_id=$1
ORDER BY RANDOM()
LIMIT 10`,
[tema_id]
)

res.json(result.rows)

})

app.listen(3000,()=>{
console.log("API running on port 3000")
})

Endpoints

GET /preguntas

POST /tests/generate