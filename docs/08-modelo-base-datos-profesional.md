# Modelo de base de datos profesional

## Objetivo

Diseñar una base de datos capaz de gestionar:

- cientos de oposiciones
- millones de preguntas
- millones de respuestas

---

# Tablas principales

## usuarios

id  
nombre  
email  
password_hash  
fecha_registro  
estado

---

## oposiciones

id  
nombre  
descripcion  

---

## materias

id  
oposicion_id  
nombre  

---

## temas

id  
materia_id  
nombre  

---

## preguntas

id  
tema_id  
tipo_pregunta  
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
tipo_test  
numero_preguntas  
fecha

---

## test_preguntas

id  
test_id  
pregunta_id  
orden

---

## respuestas_usuario

id  
test_id  
pregunta_id  
respuesta_id  
correcta

---

# Tablas de aprendizaje

## preguntas_falladas

usuario_id  
pregunta_id  
veces_fallada  

---

## preguntas_dudosas

usuario_id  
pregunta_id  

---

## historial_estudio

usuario_id  
tema_id  
preguntas_realizadas  
aciertos  

---

# Índices recomendados

Index en:

- pregunta_id
- usuario_id
- tema_id
- oposicion_id