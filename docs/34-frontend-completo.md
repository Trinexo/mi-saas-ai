# Frontend completo

## Tecnologías

React
Vite
Tailwind

---

# Instalación

cd frontend

npm install

npm run dev

---

# api.js

const API="http://localhost:3000"

export async function generateTest(){

const res=await fetch(API+"/tests/generate",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
temas:[1],
numero_preguntas:10
})
})

return res.json()

}

Test.jsx

```javascript
import {useEffect,useState} from "react"
import {generateTest} from "../services/api"

export default function Test(){

const [questions,setQuestions]=useState([])

useEffect(()=>{
generateTest().then(setQuestions)
},[])

return(

<div>

{questions.map(q=>(
<div key={q.id}>
<h3>{q.enunciado}</h3>
</div>
))}

</div>

)

}

Admin.jsx

Panel básico para crear preguntas.

Formulario:

enunciado

opciones

respuesta correcta