# Dataset de preguntas de ejemplo

## Objetivo

Cargar un banco inicial grande de preguntas para pruebas.

---

# Formato CSV

pregunta_id,tema_id,enunciado,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta,explicacion

---

# Ejemplo

1,1,"¿Capital de España?","Madrid","Barcelona","Valencia","Sevilla","A","Madrid es la capital."

2,1,"¿Año de la Constitución española?","1975","1978","1982","1992","B","La Constitución se aprobó en 1978."

---

# Importador de preguntas

scripts/importQuestions.js


import fs from "fs"
import csv from "csv-parser"
import pool from "../backend/src/config/database.js"

fs.createReadStream("preguntas.csv")
.pipe(csv())
.on("data", async (row) => {

const query = `
INSERT INTO preguntas(tema_id,enunciado)
VALUES($1,$2)
`

await pool.query(query,[row.tema_id,row.enunciado])

})