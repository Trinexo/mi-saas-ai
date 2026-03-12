# Modelo de base de datos avanzado

## Tabla usuarios

id  
nombre  
email  
password_hash  
fecha_registro

---

## Tabla oposiciones

id  
nombre  
descripcion  

---

## Tabla materias

id  
oposicion_id  
nombre

---

## Tabla temas

id  
materia_id  
nombre

---

## Tabla preguntas

id  
tema_id  
tipo_pregunta  
enunciado  
explicacion  
nivel_dificultad  
fecha_actualizacion

---

## Tabla opciones_respuesta

id  
pregunta_id  
texto  
correcta

---

## Tabla test

id  
usuario_id  
tipo_test  
numero_preguntas  
fecha_creacion

---

## Tabla test_preguntas

id  
test_id  
pregunta_id  
orden

---

## Tabla respuestas_usuario

id  
test_id  
pregunta_id  
respuesta_id  
correcta

---

## Tabla resultados_test

id  
test_id  
aciertos  
errores  
blancos  
nota  
fecha

---

# Índices recomendados

Index en:

- pregunta_id
- tema_id
- oposicion_id

Para mejorar rendimiento.