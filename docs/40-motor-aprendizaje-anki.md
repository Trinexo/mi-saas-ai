# Motor de aprendizaje tipo Anki

## Objetivo

Mejorar la retención usando repetición espaciada.

---

# Principio

Las preguntas se repiten según el rendimiento del usuario.

---

# Variables

ultima_revision  
nivel_memoria  
intervalo_revision

---

# Algoritmo

Si usuario falla:

nivel_memoria = 0

intervalo = 1 día

---

Si usuario acierta:

nivel_memoria += 1

intervalo:

1 → 3 días  
2 → 7 días  
3 → 14 días  
4 → 30 días  

---

# Tabla repeticion_espaciada

usuario_id  
pregunta_id  
nivel_memoria  
proxima_revision

---

# Generación de test adaptativo

SELECT preguntas
WHERE proxima_revision <= NOW()

---

# Beneficio

- estudio eficiente
- mayor retención
- menos tiempo de repaso
