# Backend base con Node.js

## Tecnologías

Node.js  
Express  
PostgreSQL  
Redis

---

# Estructura

src

controllers  
services  
models  
routes  
middleware

---

# Ejemplo servidor básico

server.js

const express = require("express")
const app = express()

app.use(express.json())

app.get("/health", (req, res) => {
res.json({ status: "ok" })
})

app.listen(3000, () => {
console.log("API running on port 3000")
})


---

# Middleware autenticación

authMiddleware.js


```javascript
const { Pool } = require("pg")

const pool = new Pool({
host:"localhost",
port:5432,
user:"app",
password:"password",
database:"oposiciones"
})

module.exports = pool



