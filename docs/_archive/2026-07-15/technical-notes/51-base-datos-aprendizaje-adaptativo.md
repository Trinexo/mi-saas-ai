# Base de datos para aprendizaje adaptativo

## Objetivo

Guardar el rendimiento del usuario para personalizar el aprendizaje.

---

# Tabla progreso_usuario

usuario_id

tema_id

preguntas_vistas

aciertos

errores

tiempo_medio

---

# Tabla repeticion_espaciada

usuario_id

pregunta_id

nivel_memoria

proxima_revision

---

# Tabla historial_preguntas

usuario_id

pregunta_id

fecha_respuesta

correcta

---

# Tabla rendimiento_pregunta

pregunta_id

veces_respondida

tasa_error

tiempo_medio_respuesta

---

# Uso

El sistema utiliza estos datos para:

detectar debilidades

repetir preguntas difíciles

adaptar dificultad