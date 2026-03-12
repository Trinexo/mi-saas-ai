# Modelo de base de datos gran escala

## Objetivo

Permitir manejar:

- millones de preguntas
- millones de respuestas
- miles de oposiciones

---

# Entidades principales

usuarios  
oposiciones  
materias  
temas  
preguntas  
opciones  
tests  
resultados  

---

# Tablas principales

## preguntas

id  
tema_id  
tipo  
enunciado  
explicacion  
nivel_dificultad  
estado  

---

## opciones_respuesta

id  
pregunta_id  
texto  
correcta  

---

## test

id  
usuario_id  
tipo  
numero_preguntas  
fecha_creacion  

---

## test_preguntas

id  
test_id  
pregunta_id  

---

## respuestas_usuario

id  
test_id  
pregunta_id  
respuesta_id  
correcta  

---

# Tablas de aprendizaje

## progreso_tema

usuario_id  
tema_id  
aciertos  
errores  

---

## preguntas_historial

usuario_id  
pregunta_id  
veces_vista  

---

## preguntas_falladas

usuario_id  
pregunta_id  
contador  

---

# Indexación

Index en:

- pregunta_id
- usuario_id
- tema_id
- oposicion_id