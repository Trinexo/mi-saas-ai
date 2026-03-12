# Flujo completo de un test

## Objetivo

Describir todo el proceso desde que el usuario inicia un test hasta que obtiene resultados.

---

# Paso 1

Usuario entra en la plataforma.

Selecciona oposición.

---

# Paso 2

Selecciona tipo de test.

Opciones:

- por tema
- simulacro
- repaso

---

# Paso 3

Frontend envía petición a la API.

POST /tests/generate

---

# Paso 4

Backend consulta base de datos.

Selecciona preguntas:

- temas seleccionados
- dificultad equilibrada
- preguntas no recientes

---

# Paso 5

API devuelve preguntas al frontend.

---

# Paso 6

Usuario responde preguntas.

Las respuestas se guardan temporalmente.

---

# Paso 7

Usuario envía test.

POST /tests/submit

---

# Paso 8

Backend corrige automáticamente.

Calcula:

aciertos  
errores  
blancos  
nota  

---

# Paso 9

Se guardan resultados en base de datos.

---

# Paso 10

Frontend muestra:

resultado

explicaciones

estadísticas
