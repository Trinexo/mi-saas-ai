# Motor inteligente de generación de test

## Objetivo

Evitar repetición de preguntas y adaptar dificultad.

---

# Datos analizados

El sistema analiza:

- preguntas vistas
- preguntas falladas
- dificultad
- tiempo respuesta

---

# Algoritmo

1 obtener preguntas no vistas
2 priorizar falladas
3 ajustar dificultad

---

# Ponderación

score = 0

si pregunta fallada:
score +5

si dificultad media:
score +2

si pregunta reciente:
score -3

---

# Selección

ordenar preguntas por score

seleccionar top N

---

# Beneficio

- aprendizaje personalizado
- evita repetición excesiva