# Sistema de repetición espaciada

## Objetivo

Optimizar el aprendizaje repitiendo preguntas en intervalos.

---

# Concepto

Las preguntas falladas se repiten con mayor frecuencia.

Las acertadas se repiten en intervalos mayores.

---

# Intervalos

Primera vez fallada → repetir en 1 día

Segunda vez fallada → repetir en 2 días

Acierto consecutivo → repetir en 7 días

---

# Modelo simplificado

nivel_memoria = 0

si fallo:
nivel_memoria = 0

si acierto:
nivel_memoria +1

---

# Intervalos ejemplo

nivel 0 → repetir mañana  
nivel 1 → repetir en 3 días  
nivel 2 → repetir en 7 días  
nivel 3 → repetir en 14 días

---

# Beneficio

- mejora retención
- reduce tiempo de estudio