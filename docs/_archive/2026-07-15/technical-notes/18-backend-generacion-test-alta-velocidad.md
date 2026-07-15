# Backend optimizado para generación de test

## Objetivo

Generar un test completo en menos de 100 ms.

---

# Estrategia

Separar:

- lectura de preguntas
- lógica de selección
- entrega al usuario

---

# Flujo

Usuario solicita test

↓

API recibe petición

↓

servicio de test consulta cache

↓

si no existe

consulta base datos

↓

selección preguntas

↓

guardar test generado

↓

entregar al cliente

---

# Optimización

## Cache Redis

Guardar:

- preguntas populares
- test generados

---

## Preindexado

Crear índices por:

- oposición
- tema
- dificultad

---

# Consulta optimizada

SELECT pregunta_id
FROM preguntas_index
WHERE tema_id IN (...)
ORDER BY RANDOM()
LIMIT 20

---

# Estrategia avanzada

Generar pools de preguntas.

Ejemplo:

pool_tema_1  
pool_tema_2  

Seleccionar desde pool reduce consultas.