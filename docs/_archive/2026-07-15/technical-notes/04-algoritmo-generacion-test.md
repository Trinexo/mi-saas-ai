# Algoritmo de generación de test

## Objetivo

Seleccionar preguntas aleatorias según:

- oposición
- tema
- dificultad
- historial usuario

---

# Algoritmo básico

1. Usuario selecciona configuración
2. Obtener temas seleccionados
3. Consultar preguntas
4. Aleatorizar
5. Limitar número de preguntas

---

# Ejemplo SQL

SELECT *
FROM preguntas
WHERE tema_id IN (...)
ORDER BY RANDOM()
LIMIT 20

---

# Algoritmo adaptativo

Priorizar:

- preguntas falladas
- preguntas poco respondidas
- dificultad media

Pseudo algoritmo:

if usuario_fallo_pregunta:
prioridad += 3

if dificultad_media:
prioridad += 1

ordenar_por_prioridad()

---

# Evitar repetición

Guardar preguntas usadas:

tabla historial_preguntas

Excluir últimas 100 preguntas.