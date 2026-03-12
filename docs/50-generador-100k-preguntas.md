# Sistema para generar 100.000 preguntas automáticamente

## Objetivo

Crear grandes bancos de preguntas de forma semi-automática.

---

# Pipeline de generación

1 importar temario
2 dividir por secciones
3 generar preguntas
4 validar
5 almacenar

---

# Ejemplo de estructura

Tema

↓

subtemas

↓

conceptos clave

↓

preguntas

---

# Formato de generación

Pregunta

A  
B  
C  
D  

Respuesta correcta

Explicación

Referencia normativa

---

# Automatización

scripts/generateQuestions.js

Pasos:

leer temario

generar preguntas

guardar en CSV

importar a base de datos

---

# Escalado

100 temas

x

1.000 preguntas

=

100.000 preguntas
