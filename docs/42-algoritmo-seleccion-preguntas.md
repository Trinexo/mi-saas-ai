# Algoritmo avanzado de selección de preguntas

## Objetivo

Seleccionar preguntas de forma inteligente.

Evitar:

- repetición excesiva
- preguntas demasiado fáciles
- aprendizaje pasivo

---

# Variables analizadas

pregunta_vista

pregunta_fallada

nivel_dificultad

tiempo_respuesta

---

# Puntuación de prioridad

score = 0

si pregunta_fallada
score += 5

si dificultad_media
score += 2

si pregunta_reciente
score -= 3

---

# Selección

1 obtener preguntas del tema

2 calcular score

3 ordenar por score

4 seleccionar top N

---

# Balance de dificultad

Distribución recomendada:

40% dificultad media

30% fácil

30% difícil

---

# Evitar repetición

Registrar últimas 200 preguntas vistas.

Excluirlas en nuevas selecciones.

---

# Beneficio

- aprendizaje dinámico
- mejor retención
