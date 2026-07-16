# Algoritmo de aprendizaje adaptativo

## Objetivo

Adaptar los test al nivel del usuario.

---

# Datos analizados

El sistema analiza:

- preguntas falladas
- tiempo de respuesta
- número de intentos
- dificultad de preguntas

---

# Perfil del usuario

Cada usuario tiene un perfil:

nivel_global
temas_fuertes
temas_debiles

---

# Algoritmo de selección

Para generar un test:

1 detectar temas débiles
2 seleccionar preguntas de esos temas
3 ajustar dificultad

---

# Ponderación

prioridad = 0

si pregunta fallada:
prioridad +3

si dificultad media:
prioridad +1

si pregunta reciente:
prioridad -2

---

# Ejemplo

Si un usuario falla mucho un tema:

el sistema aumenta frecuencia de preguntas de ese tema.

---

# Beneficio

Permite:

- aprendizaje más rápido
- repaso inteligente