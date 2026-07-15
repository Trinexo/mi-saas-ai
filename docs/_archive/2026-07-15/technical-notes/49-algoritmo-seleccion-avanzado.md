# Algoritmo avanzado de selección de preguntas

## Objetivo

Seleccionar preguntas de forma inteligente para maximizar el aprendizaje.

El algoritmo debe:

- evitar repetición excesiva
- reforzar debilidades
- equilibrar dificultad

---

# Variables utilizadas

pregunta_vista_reciente  
pregunta_fallada  
nivel_dificultad  
tiempo_respuesta  
nivel_usuario  

---

# Score de prioridad

Cada pregunta recibe un score.

score = 0

si pregunta fallada recientemente
score += 6

si dificultad media
score += 2

si dificultad adecuada al nivel del usuario
score += 3

si pregunta vista recientemente
score -= 5

---

# Selección final

1 obtener preguntas del tema
2 calcular score
3 ordenar por score
4 seleccionar top N

---

# Balance de dificultad

Distribución recomendada:

40% preguntas medias  
30% fáciles  
30% difíciles  

---

# Evitar repetición

Guardar historial de últimas 200 preguntas vistas.

Excluirlas al generar nuevo test.
