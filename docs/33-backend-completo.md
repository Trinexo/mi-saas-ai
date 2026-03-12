# Backend completo

## Instalación

cd backend

npm install

---

# Dependencias

express
pg
jsonwebtoken
bcrypt
cors
dotenv

---

# server.js

import express from "express"
import cors from "cors"
import testRoutes from "./routes/testRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/tests",testRoutes)

app.listen(3000,()=>{
console.log("Server running")
})


---

# testRoutes.js

import express from "express"
import {generateTest} from "../controllers/testController.js"

const router = express.Router()

router.post("/generate",generateTest)

export default router

testController.js

```javascript
import pool from "../config/database.js"

export async function generateTest(req,res){

const {temas,numero_preguntas}=req.body

const query=`
SELECT * FROM preguntas
WHERE tema_id = ANY($1)
ORDER BY RANDOM()
LIMIT $2
`

const result=await pool.query(query,[temas,numero_preguntas])

res.json(result.rows)

}

database.js

```javascript
import pkg from "pg"

const {Pool}=pkg

const pool=new Pool({
host:"localhost",
user:"postgres",
password:"password",
database:"test_platform"
})

export default pool