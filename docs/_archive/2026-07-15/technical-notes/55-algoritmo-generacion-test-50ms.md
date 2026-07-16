# Generación de test en menos de 50 ms

## Objetivo

Reducir el tiempo de generación de tests.

---

# Estrategia

No generar test desde cero cada vez.

Utilizar pools de preguntas.

---

# Pools

pool_tema_1

pool_tema_2

pool_tema_3

Cada pool contiene preguntas preseleccionadas.

---

# Algoritmo

1 obtener pool del tema

2 filtrar preguntas recientes

3 seleccionar N preguntas aleatorias

---

# Ejemplo consulta

SELECT pregunta_id
FROM pool_tema_1
ORDER BY RANDOM()
LIMIT 20

---

# Optimización

Guardar pools en Redis.

Actualizar cada 5 minutos.
Actualizar cada 5 minutos.
