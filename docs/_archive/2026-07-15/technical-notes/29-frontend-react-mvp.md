# `29-frontend-react-mvp.md`

```md id="frontend-react-mvp"
# Frontend MVP

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

# Estructura

src/

components/
TestQuestion.jsx
TestNavigation.jsx

pages/
Home.jsx
TestPage.jsx
ResultsPage.jsx

services/
api.js

---

# Ejemplo componente pregunta

TestQuestion.jsx

export default function TestQuestion({question}){

return(

<div>

<h2>{question.enunciado}</h2>

{question.opciones.map((opcion)=>(
<button key={opcion.id}>{opcion.texto}</button>
))}

</div>

)

}

Flujo de la aplicación

Home → seleccionar oposición
↓

generar test
↓

resolver preguntas
↓

ver resultados
